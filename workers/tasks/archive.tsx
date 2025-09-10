/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

import React from 'react';

import {
	Collection,
	CollectionAttribution,
	Community,
	CustomScript,
	Draft,
	includeUserModel,
	Member,
	Page,
	Pub,
	Release,
	ScopeSummary,
	sequelize,
} from 'server/models';

import archiver from 'archiver';
import { renderStatic } from 'client/components/Editor/utils/renderStatic';
import { editorSchema } from 'client/components/Editor/utils/schema';
import { performance } from 'perf_hooks';
import ReactDOMServer from 'react-dom/server';
import { Op } from 'sequelize';
import { CollectionPub } from 'server/collectionPub/model';
import { fetchFacetsForScopeIds } from 'server/facets';
import { getDatabaseRef, getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { buildPubOptions } from 'server/utils/queryHelpers';
import { assetsClient } from 'server/utils/s3';
import { updateWorkerTask } from 'server/workerTask/queries';
import { PassThrough, Readable, Transform } from 'stream';
import { DocJson } from 'types';
import { communityUrl } from 'utils/canonicalUrls';
import { isProd } from 'utils/environment';
import { getTextAbstract } from 'utils/pub/metadata';
import type { CascadedFacetsForScopes } from 'facets';
import { createSiteDownloaderTransform, generateAssetUrl } from './archive/siteDownloaderTransform';
import {
	addHrefsToNotes,
	filterNonExportableNodes,
	getCitationLinkage,
	getFootnoteLinkage,
} from './export/html';
import { getNotesData } from './export/notes';
import SimpleNotesList from './export/SimpleNotesList';
// for some reason when imported from utils/notes, it tries to import the client/utils/notes.ts file instead
import { renderNotesForListing } from '../../utils/notes';

// progress tracking utilities
class ProgressTracker {
	private workerTaskId: string;
	private totalUrls: number;
	private processedUrls: number = 0;
	private lastUpdateTime: number = 0;
	private updateThrottleMs: number = 2000; // update every 2 seconds

	constructor(workerTaskId: string, totalUrls: number) {
		this.workerTaskId = workerTaskId;
		this.totalUrls = totalUrls;
	}

	async incrementProcessed() {
		this.processedUrls++;
		const now = Date.now();

		// throttle updates to avoid too many database writes
		if (
			now - this.lastUpdateTime > this.updateThrottleMs ||
			this.processedUrls === this.totalUrls
		) {
			await this.updateProgress();
			this.lastUpdateTime = now;
		}
	}

	private async updateProgress() {
		const percentage = Math.round((this.processedUrls / this.totalUrls) * 100);

		try {
			await updateWorkerTask({
				id: this.workerTaskId,
				body: {
					output: {
						progress: {
							totalUrls: this.totalUrls,
							processedUrls: this.processedUrls,
							percentage,
						},
					},
				},
			});
			console.log(`Progress: ${this.processedUrls}/${this.totalUrls} (${percentage}%)`);
		} catch (error) {
			console.error('Failed to update progress:', error);
		}
	}

	getProgress() {
		return {
			totalUrls: this.totalUrls,
			processedUrls: this.processedUrls,
			percentage: Math.round((this.processedUrls / this.totalUrls) * 100),
		};
	}
}

type FacetsProps = CascadedFacetsForScopes<
	'CitationStyle' | 'License' | 'NodeLabels' | 'PubEdgeDisplay' | 'PubHeaderTheme'
>['pub'][string];
const getReleaseHtml = async (facets: FacetsProps, doc: DocJson) => {
	// const pubMetadata = await getPubMetadata(pub.id);
	const citationInlineStyle = facets.CitationStyle.value.inlineCitationStyle;
	const citationStyle = facets.CitationStyle.value.citationStyle;
	const nodeLabels = facets.NodeLabels.value;

	const notesData = await getNotesData(
		{
			citationStyle,
			citationInlineStyle,
		},
		doc!,
	);
	const { footnotes, citations, noteManager, renderedStructuredValues } = notesData;

	const renderedNotes = renderNotesForListing({
		footnotes,
		citations,
		citationInlineStyle,
		renderedStructuredValues,
	});

	// i don't really understand why this works, but
	// `doc.content?.map(filterNonExportableNotes)` doesn't
	const renderableNodes = [filterNonExportableNodes, addHrefsToNotes]
		.filter((x): x is (nodes: any) => any => !!x)
		.reduce((nodes, fn) => fn(nodes), doc.content);

	const docContent = renderStatic({
		schema: editorSchema,
		doc: { type: 'doc', content: renderableNodes },
		noteManager,
		nodeLabels,
	});

	const notes = (
		<div className="pub-notes">
			<SimpleNotesList
				title="Footnotes"
				notes={renderedNotes.footnotes}
				getLinkage={(_, index) => getFootnoteLinkage(index)}
			/>
			<SimpleNotesList
				title="References"
				notes={renderedNotes.citations}
				getLinkage={(note) =>
					getCitationLinkage(note.unstructuredValue, note.structuredValue, note.id)
				}
			/>
		</div>
	);

	const releaseHtml = ReactDOMServer.renderToStaticMarkup(
		<article>
			{docContent}
			{notes}
		</article>,
	);

	return releaseHtml;
};

const createPubStream = async (pubs: Pub[], batchSize = 100) => {
	let offset = 0;
	let hasMore = true;

	// we put this in one transaction to ensure we are getting the pubs from the same db
	const trx = await sequelize.transaction();

	return new Readable({
		objectMode: true,
		async read() {
			if (!hasMore) {
				await trx.commit();
				this.push(null);
				return;
			}

			performance.mark('get pubs start');
			// its more efficient to first get all the pub ids + draftRefs, then get the pubs + drafts in one go,
			// rather than first getting the pubs, looking at their draftRefs, and then getting the drafts
			// the latter would take too much time, but the current uses more memory
			const pubIdSlice = pubs.slice(offset, offset + batchSize);
			console.log(`Getting ${pubIdSlice.length} pubs`);
			performance.mark('get pubs start');
			const [foundPubs, drafts] = await Promise.all([
				Pub.findAll({
					where: { id: { [Op.in]: pubIdSlice.map((p) => p.id) } },
					...buildPubOptions({
						getCollections: false,
						getMembers: true,
						getEdges: 'all',
						getExports: true,
						getDiscussions: true,
						getSubmissions: true,
						getReviews: true,
						getDraft: true,
						getFacets: true,
						getEdgesOptions: {
							includeTargetPub: true,
						},
					}),
					order: [['createdAt', 'ASC']],
					transaction: trx,
				}),
				Promise.all(
					pubIdSlice.map(async (p) => {
						const firebasePath = p.draft?.firebasePath;

						if (!firebasePath) {
							return null;
						}

						try {
							const draftDocPromise = getPubDraftDoc(
								getDatabaseRef(firebasePath),
								null,
								false,
							).then((d) => d.doc);

							const [draftDoc, facets] = await Promise.all([
								draftDocPromise,
								fetchFacetsForScopeIds({
									pub: [p.id],
								}),
							]);

							const pubFacets = facets.pub[p.id];

							if (!draftDoc) {
								return {
									facets: pubFacets,
									content: null,
									firebasePath,
									html: null,
									abstract: null,
								};
							}

							const draftHtmlPromise = getReleaseHtml(pubFacets, draftDoc);

							const draftHtml = await draftHtmlPromise;
							const abstract = getTextAbstract(draftDoc);
							return {
								facets: pubFacets,
								content: draftDoc,
								firebasePath,
								html: draftHtml,
								abstract,
							};
						} catch (e) {
							console.error(`Error getting draft doc for pub ${p.id}:`, e);
							return null;
						}
					}),
				),
			]);

			const pubsWithDraftsAndFacets = foundPubs.map((pub) => {
				const pubJson = pub.toJSON();
				const firebaseDraft = drafts.find(
					(d) => d?.firebasePath === pubJson.draft?.firebasePath,
				);
				if (!firebaseDraft) {
					console.error(`Draft not found for pub ${pubJson.id}`);
				}

				const { html, abstract, facets, ...draft } = firebaseDraft ?? {};

				return {
					...pubJson,
					facets,
					draft: {
						...pubJson.draft,
						doc: draft,
					},
					html,
					abstract,
				};
			});

			hasMore = foundPubs.length === batchSize;
			offset += batchSize;

			performance.mark('get pubs end');
			console.log(
				`Time taken to handle batch: ${
					performance.measure('get pubs', 'get pubs start', 'get pubs end').duration
				}ms`,
			);

			console.log(`Has more: ${hasMore}. Offset: ${offset}. Limit: ${pubs.length}`);

			// eslint-disable-next-line no-restricted-syntax
			for (const pub of pubsWithDraftsAndFacets) {
				this.push(pub);
			}
		},
	});
};

// memory tracking utilities only exported in dev
const createDevTools = () => {
	if (isProd()) {
		return {
			getMemoryStats: () => ({}),
			createMemoryTracker: () => ({ maxHeapUsed: 0, dataCount: 0 }),
			logStats: () => {},
		};
	}

	const getMemoryStats = () => {
		const used = process.memoryUsage();
		return {
			heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
			heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
			rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
		};
	};

	return {
		getMemoryStats,
		// eslint-disable-next-line no-undef
		createMemoryTracker: (stream: NodeJS.ReadableStream, batchSize = 100) => {
			let maxHeapUsed = 0;
			let dataCount = 0;

			stream.on('data', () => {
				const { heapUsed } = process.memoryUsage();
				maxHeapUsed = Math.max(maxHeapUsed, heapUsed);
				dataCount++;

				if (dataCount % batchSize === 0) {
					console.log(`Memory after ${dataCount} items:`, getMemoryStats());
				}
			});

			return { maxHeapUsed, dataCount };
		},
		logStats: (
			startTime: number,
			pubTracker: ReturnType<typeof devTools.createMemoryTracker>,
			jsonTracker: ReturnType<typeof devTools.createMemoryTracker>,
		) => {
			const endTime = performance.now();
			const duration = ((endTime - startTime) / 1000).toFixed(2);

			console.log('Final memory usage:', getMemoryStats());
			console.log(`Total time: ${duration} seconds`);
			console.log('Peak memory usage during streaming:', {
				pubStream: `${Math.round(pubTracker.maxHeapUsed / 1024 / 1024)} MB`,
				jsonTransform: `${Math.round(jsonTracker.maxHeapUsed / 1024 / 1024)} MB`,
			});
		},
	};
};

const devTools = createDevTools();
const BATCH_SIZE = 200;

// create a transform that prepends community data before pubs array
const createCommunityJsonTransform = (communityData: any) => {
	let hasWrittenPrefix = false;
	return new Transform({
		objectMode: true,
		transform(chunk, _, callback) {
			if (!hasWrittenPrefix) {
				// write the community data first, then start the pubs array
				let prefix = JSON.stringify(
					{
						community: communityData.community,
						collections: communityData.collections,
						pages: communityData.pages,
						pubs: [],
					},
					null,
					2,
				);

				// so we end up with `"pubs": [`
				prefix = prefix.slice(0, -3);

				hasWrittenPrefix = true;
				try {
					const chunkString = prefix + '\n' + JSON.stringify(chunk);
					callback(null, chunkString);
				} catch (e) {
					console.dir(chunk, { depth: 6 });
					throw e;
				}
			} else {
				try {
					const chunkString = ',\n' + JSON.stringify(chunk);
					callback(null, chunkString);
				} catch (e) {
					console.dir(chunk, { depth: null });
					throw e;
				}
			}
		},
		flush(callback) {
			callback(null, '\n]}');
		},
	});
};

const getCommunityData = async (communityId: string) => {
	// fetch all community data in one transaction
	const result = await sequelize.transaction(async (trx) => {
		const [community, customScripts, collections, pages] = await Promise.all([
			Community.findByPk(communityId, {
				transaction: trx,
				include: [
					{ model: ScopeSummary, as: 'scopeSummary' },
					{
						model: Member,
						as: 'members',
						foreignKey: 'communityId',
						attributes: [
							'id',
							'userId',
							'permissions',
							'isOwner',
							'subscribedToActivityDigest',
						],
						include: [includeUserModel({ as: 'user', required: false })],
					},
				],
			}),
			CustomScript.findAll({
				where: { communityId },
				transaction: trx,
			}),
			Collection.findAll({
				where: { communityId },
				transaction: trx,
				include: [
					{
						model: CollectionPub,
						as: 'collectionPubs',
						foreignKey: 'collectionId',
					},
					{ model: ScopeSummary, as: 'scopeSummary' },
					{
						model: CollectionAttribution,
						as: 'attributions',
						include: [includeUserModel({ as: 'user', required: false })],
					},
					{
						model: Member,
						as: 'members',
						foreignKey: 'collectionId',
						// we dont care about communityId etc
						attributes: [
							'id',
							'userId',
							'permissions',
							'isOwner',
							'subscribedToActivityDigest',
						],
						include: [includeUserModel({ as: 'user', required: false })],
					},
				],
			}),
			Page.findAll({
				where: { communityId },
				transaction: trx,
			}),
		]);

		const facets = await fetchFacetsForScopeIds({
			community: [communityId],
			collection: collections.map((c) => c.id),
		});

		return {
			community: {
				...community?.toJSON(),
				facets: facets.community[communityId],
				customScripts,
			},
			collections: collections.map((c) => ({
				...c.toJSON(),
				facets: facets.collection[c.id],
			})),
			pages: pages.map((p) => p.toJSON()),
		};
	});

	return result;
};

const getPubs = async (communityId: string) => {
	const pubs = await Pub.findAll({
		where: { communityId },
		attributes: ['id', 'slug'],
		include: [
			{
				model: Draft,
				as: 'draft',
				attributes: ['firebasePath'],
			},
			{
				model: Release,
				as: 'releases',
				attributes: ['historyKey', 'createdAt'],
				separate: true,
			},
		],
		order: [['createdAt', 'ASC']],
		limit: 1_000_000,
	});

	return pubs;
};

// create multiple readable streams that generate URLs for public pages, collections, and all pub releases
const createUrlStreams = (communityData: any, pubs: Pub[], numStreams: number) => {
	const baseUrl =
		process.env.NODE_ENV === 'production'
			? communityUrl(communityData.community)
			: 'http://localhost:9876';

	const urls: string[] = [];
	const param = '?pubpubArchiveBot=1';

	// add public pages
	communityData.pages
		.filter((page: any) => page.isPublic)
		.forEach((page: any) => {
			// home page
			if (!page.slug) {
				urls.push(`${baseUrl}/`);
				return;
			}
			urls.push(`${baseUrl}/${page.slug}${param}`);
		});

	// add public collections
	communityData.collections
		.filter((collection: any) => collection.isPublic)
		.forEach((collection: any) => {
			urls.push(`${baseUrl}/${collection.slug}${param}`);
		});

	// add pub releases
	pubs.forEach((pub) => {
		if (pub.releases && pub.releases.length > 0) {
			pub.releases.forEach((release, index) => {
				const releaseNumber = index + 1;
				urls.push(`${baseUrl}/pub/${pub.slug}/release/${releaseNumber}${param}`);
			});
			urls.push(`${baseUrl}/pub/${pub.slug}${param}`);
		}
	});

	console.log(`Generated ${urls.length} URLs to be split across ${numStreams} streams`);

	// split URLs into chunks for each stream
	const chunkSize = Math.ceil(urls.length / numStreams);
	const urlChunks: string[][] = [];

	for (let i = 0; i < numStreams; i++) {
		const start = i * chunkSize;
		const end = Math.min(start + chunkSize, urls.length);
		urlChunks.push(urls.slice(start, end));
	}

	// create a stream for each chunk
	const urlStreams = urlChunks.map((urlChunk) => {
		let urlIndex = 0;

		return new Readable({
			objectMode: true,
			read() {
				if (urlIndex >= urlChunk.length) {
					this.push(null);
					return;
				}

				this.push(urlChunk[urlIndex]);
				urlIndex++;
			},
		});
	});

	return {
		urlStreams,
		totalUrls: urls.length,
	};
};

const ASSET_URL_PATTERN = /"https:\/\/assets\.pubpub\.org\/[a-z0-9]*\/[0-9]*\.[a-zA-Z]+"/g;

const transformAssetLinksInViewDataJSON = (startTag: any, pageUrl: URL) => {
	const viewDataAttr = startTag.attrs.find((attr) => attr.name === 'data-json');

	if (viewDataAttr === undefined) {
		return;
	}

	viewDataAttr.value = (viewDataAttr.value as string).replace(ASSET_URL_PATTERN, (url) => {
		const urlWithoutQuotes = url.replace(/"/g, '');
		const result = generateAssetUrl(urlWithoutQuotes, pageUrl, {
			assetDir: 'assets',
		});
		return result === null ? url : `"${result.assetPath}"`;
	});
};

export const archiveTask = async ({
	communityId,
	key,
	numUrlStreams = 5,
	workerTaskId,
}: {
	communityId: string;
	key: string;
	numUrlStreams?: number;
	workerTaskId?: string;
}) => {
	const startTime = performance.now();
	devTools.getMemoryStats();

	// get community data + all pubs first
	// eslint-disable-next-line prefer-const
	let [communityData, pubs] = await Promise.all([
		getCommunityData(communityId),
		getPubs(communityId),
	]);

	console.log(`Found ${pubs.length} pubs`);

	const pubReadStream = await createPubStream(pubs, BATCH_SIZE);
	const communityJsonTransform = createCommunityJsonTransform(communityData);
	const communityJsonArchiveStream = pubReadStream.pipe(communityJsonTransform);

	const archiveStream = archiver('zip', { zlib: { level: 9 } });

	const pubTracker = devTools.createMemoryTracker(pubReadStream, BATCH_SIZE);
	const jsonTracker = devTools.createMemoryTracker(communityJsonTransform, BATCH_SIZE);

	archiveStream.append(communityJsonArchiveStream, {
		name: 'export.json',
	});

	const begin = () => {
		// create URL streams for pages, collections, and pub releases
		const { urlStreams, totalUrls } = createUrlStreams(communityData, pubs, numUrlStreams);

		let nCompletedStreams = 0;
		const totalStreams = urlStreams.length;
		const endUrlStream = () => {
			if (++nCompletedStreams === totalStreams) {
				archiveStream.finalize();
			}
		};

		// initialize progress tracking
		let progressTracker: ProgressTracker | null = null;
		if (workerTaskId) {
			progressTracker = new ProgressTracker(workerTaskId, totalUrls);
			console.log(`Starting archive with ${totalUrls} URLs to process`);
		}

		urlStreams.forEach((urlStream, index) => {
			console.log(`Starting URL stream ${index + 1}/${totalStreams}`);
			urlStream
				.pipe(
					createSiteDownloaderTransform({
						headers: {
							'User-Agent': 'PubPub-Archive-Bot/1.0',
							Connection: 'close',
						},
						onStartTag: transformAssetLinksInViewDataJSON,
						progressTracker,
					}),
				)
				.on('data', (file) => {
					archiveStream.append(file.stream, { name: file.name });
				})
				.on('end', () => {
					console.log(`URL stream ${index + 1} completed`);
					endUrlStream();
				})
				.on('error', (err) => {
					console.error(`URL stream ${index + 1} error:`, err);
					endUrlStream();
				});
		});
	};

	// Wait until the community JSON archive stream is fully processed before
	// initializing URL streams and S3 upload.
	communityJsonArchiveStream.on('end', () => {
		console.log('Community JSON archive stream ended');
		begin();
		// free up memory
		// @ts-expect-error blah blah
		communityData = null;
	});

	const communityArchiveStream = new PassThrough();
	archiveStream.pipe(communityArchiveStream);

	try {
		await assetsClient.uploadFileSplit(`${key}.zip`, communityArchiveStream, {
			queueSize: 10,
		});
	} catch (e) {
		console.error(`Something went wrong while uploading:`, e);
		throw e;
	}

	console.log(`Uploaded archive to ${key}.zip`);

	const finalUrl = `https://assets.pubpub.org/${key}.zip`;

	// set final result in worker task (replacing progress info)
	if (workerTaskId) {
		try {
			await updateWorkerTask({
				id: workerTaskId,
				body: {
					output: finalUrl,
				},
			});
			console.log('Updated worker task with final download URL');
		} catch (error) {
			console.error('Failed to update worker task with final URL:', error);
		}
	}

	devTools.logStats(startTime, pubTracker, jsonTracker);
	const endTime = performance.now();
	console.log(`Time taken to archive: ${endTime - startTime} milliseconds`);

	return finalUrl;
};
