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
import { PassThrough, Readable, Transform } from 'stream';
import { communityUrl } from 'utils/canonicalUrls';
import { isProd } from 'utils/environment';
import { createSiteDownloaderTransform } from './archive/siteDownloaderTransform';
import { createSitemapUrlStreams } from './archive/sitemapUrlStream';
import { addHrefsToNotes, filterNonExportableNodes } from './export/html';
import { getPubMetadata } from './export/metadata';
import { getNotesData } from './export/notes';
import { ReadableStreamClone } from './archive/readableStreamClone';

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

			// its more efficient to first get all the pub ids + draftRefs, then get the pubs + drafts in one go,
			// rather than first getting the pubs, looking at their draftRefs, and then getting the drafts
			// the latter would take too much time, but the current uses more memory
			const pubIdSlice = pubs.slice(offset, offset + batchSize);
			console.log(`Getting ${pubIdSlice.length} pubs`);
			performance.mark('get pubs start');
			const [foundPubs, facets, drafts] = await Promise.all([
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
						getFullReleases: true,
						getEdgesOptions: {
							includeTargetPub: true,
						},
					}),
					order: [['createdAt', 'ASC']],
					transaction: trx,
				}),
				fetchFacetsForScopeIds({
					pub: pubIdSlice.map((p) => p.id),
				}),
				Promise.all(
					pubIdSlice.map(async (p) => {
						const firebasePath = p.draft?.firebasePath;

						if (!firebasePath) {
							return null;
						}

						try {
							const hasRelease = p.releases && p.releases.length > 0;
							const latestRelease = hasRelease ? p.releases?.at(-1) : null;
							const latestReleaseKey = latestRelease?.historyKey;
							const latestReleaseIsDraft =
								latestRelease?.createdAt > (p.draft?.latestKeyAt ?? new Date(0));

							const shouldFetchLatestRelease =
								latestReleaseKey && !latestReleaseIsDraft;

							const [draftDoc, maybeLatestReleaseDoc] = await Promise.all([
								getPubDraftDoc(getDatabaseRef(firebasePath), null, false),
								shouldFetchLatestRelease
									? getPubDraftDoc(p.id, latestReleaseKey, false)
									: null,
							]);

							if (!draftDoc) {
								return {
									content: null,
									firebasePath,
								};
							}

							const { doc, ...rest } = draftDoc;

							if (!latestRelease) {
								return {
									...rest,
									content: doc,
									firebasePath,
								};
							}

							const releaseDoc = latestReleaseIsDraft
								? draftDoc
								: maybeLatestReleaseDoc!;

							const pubMetadata = await getPubMetadata(p.id);
							const notesData = await getNotesData(pubMetadata, releaseDoc.doc!);
							const { nodeLabels } = pubMetadata;
							const { noteManager } = notesData;

							// i don't really understand why this works, but
							// doc.content?.map(filterNonExportableNotes) doesn't
							const renderableNodes = [filterNonExportableNodes, addHrefsToNotes]
								.filter((x): x is (nodes: any) => any => !!x)
								.reduce((nodes, fn) => fn(nodes), doc.content);

							const docContent = renderStatic({
								schema: editorSchema,
								doc: { type: 'doc', content: renderableNodes },
								noteManager,
								nodeLabels,
							});
							const releaseHtml = ReactDOMServer.renderToStaticMarkup(
								<article>{docContent}</article>,
							);

							return {
								...rest,
								content: doc,
								html: releaseHtml,
								firebasePath,
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
				const pubFacets = facets.pub[pubJson.id];
				const firebaseDraft = drafts.find(
					(d) => d?.firebasePath === pubJson.draft?.firebasePath,
				);
				if (!firebaseDraft) {
					console.error(`Draft not found for pub ${pubJson.id}`);
				}

				return {
					...pubJson,
					facets: pubFacets,
					draft: {
						...pubJson.draft,
						doc: firebaseDraft,
					},
					// @ts-expect-error
					html: firebaseDraft?.html,
				};
			});

			hasMore = foundPubs.length === batchSize;
			offset += batchSize;
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
const BATCH_SIZE = 1000;

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
		attributes: ['id'],
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

export const archiveTask = async ({ communityId, key }: { communityId: string; key: string }) => {
	const startTime = performance.now();
	devTools.getMemoryStats();

	// get community data + all pubs first
	const [communityData, pubs] = await Promise.all([
		getCommunityData(communityId),
		getPubs(communityId),
	]);

	console.log(`Found ${pubs.length} pubs`);

	const archiveStream = archiver('zip', { zlib: { level: 9 } });
	const sitemapUrlStreams = await createSitemapUrlStreams(
		communityUrl(communityData.community),
		5,
	);

	let nCompletedSitemapUrlStreams = 0;

	const end = () => {
		if (++nCompletedSitemapUrlStreams === sitemapUrlStreams.length) {
			archiveStream.finalize();
		}
	};

	// eslint-disable-next-line no-restricted-syntax
	for (const sitemapUrlStream of sitemapUrlStreams) {
		sitemapUrlStream
			.pipe(
				createSiteDownloaderTransform({
					headers: {
						'User-Agent': 'PubPub-Archive-Bot/1.0',
					},
				}),
			)
			.on('data', (file) => {
				archiveStream.append(file.stream, { name: file.name });
			})
			.on('end', end)
			.on('error', (err) => {
				console.error('Stream error:', err);
				end();
			});
	}

	const pubReadStream = await createPubStream(pubs, BATCH_SIZE);
	const communityJsonTransform = createCommunityJsonTransform(communityData);
	const communityJsonStream = pubReadStream.pipe(communityJsonTransform);

	const pubTracker = devTools.createMemoryTracker(pubReadStream, BATCH_SIZE);
	const jsonTracker = devTools.createMemoryTracker(communityJsonTransform, BATCH_SIZE);

	const communityJsonArchiveStream = new ReadableStreamClone(communityJsonStream);

	archiveStream.append(communityJsonArchiveStream, {
		name: 'export.json',
	});

	const communityArchiveStream = new PassThrough();

	archiveStream.pipe(communityArchiveStream);

	await assetsClient.uploadFileSplit(`${key}.zip`, communityArchiveStream);

	console.log(`Uploaded archive to ${key}`);

	devTools.logStats(startTime, pubTracker, jsonTracker);
	const endTime = performance.now();
	console.log(`Time taken to archive: ${endTime - startTime} milliseconds`);

	return `https://assets.pubpub.org/${key}`;
};
