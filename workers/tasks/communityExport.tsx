import type { CascadedFacetsForScopes } from 'facets';
import type { DocJson } from 'types';

import React from 'react';

import archiver from 'archiver';
import { performance } from 'perf_hooks';
import ReactDOMServer from 'react-dom/server';
import { Op } from 'sequelize';
import { PassThrough, Readable, Transform } from 'stream';

import { renderStatic } from 'client/components/Editor/utils/renderStatic';
import { editorSchema } from 'client/components/Editor/utils/schema';
import { fetchFacetsForScopeIds } from 'server/facets';
import {
	ActivityItem,
	Collection,
	CollectionAttribution,
	CollectionPub,
	Community,
	CommunityBan,
	CustomScript,
	DepositTarget,
	Doc,
	Draft,
	includeUserModel,
	Member,
	Page,
	Pub,
	PubAttribution,
	PublicPermissions,
	Release,
	ScopeSummary,
	sequelize,
	User,
} from 'server/models';
import { sendCommunityExportReadyEmail } from 'server/utils/email';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { buildPubOptions } from 'server/utils/queryHelpers';
import { exportsClient } from 'server/utils/s3';
import { updateWorkerTask } from 'server/workerTask/queries';
import { communityUrl } from 'utils/canonicalUrls';
import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { isProd } from 'utils/environment';
import { getAssetUrlFromResizedUrl } from 'utils/images';
import { licenseDetailsByKind } from 'utils/licenses';
import { normalizeOrcid } from 'utils/orcid';
import { getTextAbstract } from 'utils/pub/metadata';

// for some reason when imported from utils/notes, it tries to import the client/utils/notes.ts file instead
import { renderNotesForListing } from '../../utils/notes';
import {
	addHrefsToNotes,
	filterNonExportableNodes,
	getCitationLinkage,
	getFootnoteLinkage,
} from './export/html';
import { getNotesData } from './export/notes';
import SimpleNotesList from './export/SimpleNotesList';

const runWithConcurrency = async <T,>(
	items: T[],
	concurrency: number,
	fn: (item: T) => Promise<void>,
) => {
	let index = 0;
	const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
		while (index < items.length) {
			const item = items[index++];
			// biome-ignore lint/performance/noAwaitInLoops: intentional — this is a concurrency limiter, each worker processes items sequentially
			await fn(item);
		}
	});
	await Promise.all(workers);
};

type FacetsProps = CascadedFacetsForScopes<
	'CitationStyle' | 'License' | 'NodeLabels' | 'PubEdgeDisplay' | 'PubHeaderTheme'
>['pub'][string];
type PubMetadata = {
	attributions: any[];
	licenseKind: string;
};

const renderPubFooter = (metadata: PubMetadata) => {
	const attributionsWithUsers = metadata.attributions
		.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
		.map(ensureUserForAttribution);

	const authors = attributionsWithUsers.filter((a: any) => a.isAuthor);
	const contributors = attributionsWithUsers.filter((a: any) => !a.isAuthor);
	const license = licenseDetailsByKind[metadata.licenseKind as keyof typeof licenseDetailsByKind];

	return (
		<footer className="pub-footer">
			{authors.length > 0 && (
				<section className="pub-attributions">
					<h2>Authors</h2>
					<ul>
						{authors.map((a: any) => {
							const orcid = normalizeOrcid(a.orcid);

							return (
								<li key={a.id}>
									{a.user?.fullName || a.name}
									{a.affiliation && <span> ({a.affiliation})</span>}
									{orcid && (
										<span>
											{' — '}
											<a href={`https://orcid.org/${orcid}`}>ORCID</a>
										</span>
									)}
								</li>
							);
						})}
					</ul>
				</section>
			)}
			{contributors.length > 0 && (
				<section className="pub-attributions">
					<h2>Contributors</h2>
					<ul>
						{contributors.map((a: any) => {
							const orcid = normalizeOrcid(a.orcid);

							return (
								<li key={a.id}>
									{a.user?.fullName || a.name}
									{a.roles?.length > 0 && <span> — {a.roles.join(', ')}</span>}
									{a.affiliation && <span> ({a.affiliation})</span>}
									{orcid && (
										<span>
											{' — '}
											<a href={`https://orcid.org/${orcid}`}>ORCID</a>
										</span>
									)}
								</li>
							);
						})}
					</ul>
				</section>
			)}
			{license && (
				<section className="pub-license">
					<h2>License</h2>
					<p>{license.link ? <a href={license.link}>{license.full}</a> : license.full}</p>
				</section>
			)}
		</footer>
	);
};

const getReleaseHtml = async (facets: FacetsProps, doc: DocJson, metadata?: PubMetadata) => {
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

	const footer = metadata ? renderPubFooter(metadata) : null;

	const releaseHtml = ReactDOMServer.renderToStaticMarkup(
		<article>
			{docContent}
			{notes}
			{footer}
		</article>,
	);

	return releaseHtml;
};

const wrapInHtmlDocument = (title: string, bodyHtml: string) => {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; }
article { margin-bottom: 2rem; }
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
td, th { border: 1px solid #ddd; padding: 0.5rem; }
blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1rem; color: #666; }
pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
code { background: #f5f5f5; padding: 0.1rem 0.3rem; border-radius: 3px; }
.pub-notes { margin-top: 2rem; border-top: 1px solid #ddd; padding-top: 1rem; }
.pub-footer { margin-top: 2rem; border-top: 1px solid #ddd; padding-top: 1rem; }
.pub-footer h2 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; }
.pub-footer ul { list-style: none; padding-left: 0; }
.pub-footer li { margin-bottom: 0.3rem; }
.pub-license { margin-top: 1rem; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
};

/**
 * Regex matching asset URLs in rendered HTML (src="...", href="...", url('...')).
 * Captures URLs from assets.pubpub.org (including Fastly IO query params).
 */
const HTML_ASSET_URL_PATTERN =
	/(?:src|href|url\()=?"(https:\/\/assets\.pubpub\.org\/[^"?]+(?:\?[^"]*)?)"?/g;

/**
 * Extract unique asset URLs from rendered HTML, normalize them (strip resize params),
 * download each one, rewrite HTML to use local relative paths, and append the assets
 * to the archive.
 */
const processHtmlAssets = async (
	html: string,
	pubDir: string,
	archiveStream: archiver.Archiver,
	seenAssets: Map<string, string>,
): Promise<string> => {
	const assetEntries: { originalUrl: string; normalizedUrl: string; localPath: string }[] = [];
	const newAssets: { normalizedUrl: string; localPath: string }[] = [];

	// Find all asset URLs in the HTML
	let match: RegExpExecArray | null;
	const pattern = new RegExp(HTML_ASSET_URL_PATTERN.source, 'g');
	while ((match = pattern.exec(html)) !== null) {
		const originalUrl = match[1];
		const normalizedUrl = getAssetUrlFromResizedUrl(originalUrl);

		if (seenAssets.has(normalizedUrl)) {
			assetEntries.push({
				originalUrl,
				normalizedUrl,
				localPath: seenAssets.get(normalizedUrl)!,
			});
			continue;
		}

		// Derive a stable local path from the asset URL
		// e.g. https://assets.pubpub.org/abc123/1234.png → assets/abc123/1234.png
		try {
			const assetUrl = new URL(normalizedUrl);
			const localPath = `assets${assetUrl.pathname}`;
			seenAssets.set(normalizedUrl, localPath);
			newAssets.push({ normalizedUrl, localPath });
			assetEntries.push({ originalUrl, normalizedUrl, localPath });
		} catch {
			// skip malformed URLs
		}
	}

	// Download and append only newly discovered assets
	const downloadPromises = newAssets.map(async (entry) => {
		try {
			const response = await fetch(entry.normalizedUrl, {
				signal: AbortSignal.timeout(30_000),
			});
			if (!response.ok) {
				console.error(
					`[communityExport] Failed to download asset ${entry.normalizedUrl}: ${response.status}`,
				);
				return;
			}
			const buffer = Buffer.from(await response.arrayBuffer());
			archiveStream.append(buffer, { name: entry.localPath });
		} catch (e) {
			console.error(`[communityExport] Error downloading asset ${entry.normalizedUrl}:`, e);
		}
	});

	await Promise.all(downloadPromises);

	// Rewrite all asset URLs in the HTML to relative paths
	let rewrittenHtml = html;
	for (const entry of assetEntries) {
		// Calculate relative path from the pub's HTML file to the asset
		// HTML files are at e.g. pubs/slug/release-1.html, assets at assets/abc123/1234.png
		const relPath = `../../${entry.localPath}`;
		rewrittenHtml = rewrittenHtml.split(entry.originalUrl).join(relPath);
	}

	return rewrittenHtml;
};

/**
 * Generate HTML files for all pubs in the community, including drafts and releases.
 * HTML is rendered server-side from ProseMirror doc JSON using the same pipeline
 * as `getReleaseHtml`, without making any HTTP requests.
 */
const generatePubHtmlFiles = async (
	communityId: string,
	archiveStream: archiver.Archiver,
	batchSize = 50,
) => {
	// Get all pubs with their releases (including frozen Doc snapshots) and attributions
	const allPubs = await Pub.findAll({
		where: { communityId },
		attributes: ['id', 'slug', 'title'],
		include: [
			{
				model: Draft,
				as: 'draft',
				attributes: ['firebasePath'],
			},
			{
				model: Release,
				as: 'releases',
				separate: true,
				order: [['createdAt', 'ASC']],
				include: [{ model: Doc, as: 'doc' }],
			},
			{
				model: PubAttribution,
				as: 'attributions',
				include: [includeUserModel({ as: 'user' })],
			},
		],
		order: [['createdAt', 'ASC']],
	});

	console.log(`[communityExport] generatePubHtmlFiles: ${allPubs.length} pubs to process`);

	// Track downloaded assets across all pubs to avoid duplicates
	const seenAssets = new Map<string, string>();

	const PUB_CONCURRENCY = 10;

	// Process in batches to limit memory usage
	for (let offset = 0; offset < allPubs.length; offset += batchSize) {
		const batch = allPubs.slice(offset, offset + batchSize);
		console.log(
			`[communityExport] generatePubHtmlFiles: batch ${offset}–${offset + batch.length}`,
		);

		// Fetch facets for the batch
		const pubIds = batch.map((p) => p.id);
		// biome-ignore lint/performance/noAwaitInLoops: intentionally sequential — batched to limit memory
		const facets = await fetchFacetsForScopeIds({ pub: pubIds });

		// Process pubs concurrently within the batch to overlap network I/O
		// (asset downloads and Firebase draft fetches)
		// biome-ignore lint/performance/noAwaitInLoops: intentionally sequential across batches to limit memory
		await runWithConcurrency(batch, PUB_CONCURRENCY, async (pub) => {
			const pubJson = pub.toJSON() as any;
			const pubFacets = facets.pub[pub.id];
			const pubTitle = pubJson.title || pub.slug;
			const pubDir = `pubs/${pub.slug}`;
			const pubMetadata: PubMetadata = {
				attributions: pubJson.attributions || [],
				licenseKind: pubFacets.License.value.kind,
			};

			// Generate HTML for each release (from frozen Doc snapshots — no Firebase needed)
			if (pubJson.releases?.length) {
				for (let i = 0; i < pubJson.releases.length; i++) {
					const release = pubJson.releases[i];
					const docContent = release.doc?.content;
					if (!docContent) {
						console.log(
							`[communityExport] generatePubHtmlFiles: no doc for release ${i + 1} of pub ${pub.slug}`,
						);
						continue;
					}
					try {
						// biome-ignore lint/performance/noAwaitInLoops: sequential per-release — each appends to shared archive stream
						const releaseBody = await getReleaseHtml(
							pubFacets,
							docContent,
							pubMetadata,
						);
						let releaseHtml = wrapInHtmlDocument(
							`${pubTitle} — Release ${i + 1}`,
							`<h1>${pubTitle.replace(/</g, '&lt;')}</h1>\n${releaseBody}`,
						);
						releaseHtml = await processHtmlAssets(
							releaseHtml,
							pubDir,
							archiveStream,
							seenAssets,
						);
						archiveStream.append(releaseHtml, {
							name: `${pubDir}/release-${i + 1}.html`,
						});
					} catch (e) {
						console.error(
							`[communityExport] generatePubHtmlFiles: error rendering release ${i + 1} for pub ${pub.slug}:`,
							e,
						);
					}
				}
			}

			// Generate HTML for the draft (requires Firebase/checkpoint fetch)
			const firebasePath = pubJson.draft?.firebasePath;
			if (firebasePath) {
				try {
					const { doc: draftDoc } = await getPubDraftDoc(pub.id);
					if (draftDoc) {
						const draftBody = await getReleaseHtml(pubFacets, draftDoc, pubMetadata);
						let draftHtml = wrapInHtmlDocument(
							`${pubTitle} — Draft`,
							`<h1>${pubTitle.replace(/</g, '&lt;')}</h1>\n${draftBody}`,
						);
						draftHtml = await processHtmlAssets(
							draftHtml,
							pubDir,
							archiveStream,
							seenAssets,
						);
						archiveStream.append(draftHtml, {
							name: `${pubDir}/draft.html`,
						});
					}
				} catch (e) {
					console.error(
						`[communityExport] generatePubHtmlFiles: error rendering draft for pub ${pub.slug}:`,
						e,
					);
				}
			}
		});
	}

	console.log('[communityExport] generatePubHtmlFiles: done');
};

const createPubStream = async (pubs: Pub[], batchSize = 100) => {
	let offset = 0;
	let hasMore = true;

	return new Readable({
		objectMode: true,
		async read() {
			if (!hasMore) {
				this.push(null);
				return;
			}

			performance.mark('get pubs start');
			const pubIdSlice = pubs.slice(offset, offset + batchSize);
			console.log(`Getting ${pubIdSlice.length} pubs`);

			// Use a per-batch transaction to avoid holding a connection for the
			// entire streaming duration
			console.log(
				`[communityExport] createPubStream: starting batch transaction (offset=${offset})`,
			);
			const [foundPubs, _draftDocs, batchFacets] = await sequelize.transaction(
				async (trx) => {
					const pubIds = pubIdSlice.map((p) => p.id);
					const [pubs, facets] = await Promise.all([
						Pub.findAll({
							where: { id: { [Op.in]: pubIds } },
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
						// Batch facets for the entire slice in one call (not per-pub)
						fetchFacetsForScopeIds({ pub: pubIds }),
					]);
					return [pubs, null, facets] as const;
				},
			);

			console.log(
				`[communityExport] createPubStream: batch transaction done (offset=${offset}, found=${foundPubs.length})`,
			);

			// Fetch draft docs in parallel (outside the DB transaction since
			// these hit Firebase/PG checkpoints)
			console.log(
				`[communityExport] createPubStream: fetching ${pubIdSlice.length} draft docs`,
			);
			const drafts = await Promise.all(
				pubIdSlice.map(async (p) => {
					const firebasePath = p.draft?.firebasePath;
					if (!firebasePath) {
						return null;
					}

					try {
						const { doc: draftDoc } = await getPubDraftDoc(p.id);
						const pubFacets = batchFacets.pub[p.id];

						if (!draftDoc) {
							return {
								facets: pubFacets,
								content: null,
								firebasePath,
								html: null,
								abstract: null,
							};
						}

						const draftHtml = getReleaseHtml(pubFacets, draftDoc);
						const abstract = getTextAbstract(draftDoc);
						return {
							facets: pubFacets,
							content: draftDoc,
							firebasePath,
							html: await draftHtml,
							abstract,
						};
					} catch (e) {
						console.error(`Error getting draft doc for pub ${p.id}:`, e);
						return null;
					}
				}),
			);

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

// create a transform that writes pubs as a streaming JSON array (pubs.json)
const createPubsJsonTransform = () => {
	let isFirst = true;
	return new Transform({
		objectMode: true,
		transform(chunk, _, callback) {
			if (isFirst) {
				isFirst = false;
				try {
					callback(null, '[\n' + JSON.stringify(chunk));
				} catch (e) {
					console.dir(chunk, { depth: 6 });
					throw e;
				}
			} else {
				try {
					callback(null, ',\n' + JSON.stringify(chunk));
				} catch (e) {
					console.dir(chunk, { depth: null });
					throw e;
				}
			}
		},
		flush(callback) {
			callback(null, isFirst ? '[]' : '\n]');
		},
	});
};

const getCommunityData = async (communityId: string) => {
	console.log(`[communityExport] getCommunityData: starting for community ${communityId}`);
	// fetch all community data in one transaction
	const result = await sequelize.transaction(async (trx) => {
		console.log('[communityExport] getCommunityData: transaction started');
		const [
			community,
			customScripts,
			collections,
			pages,
			activityItems,
			communityBans,
			publicPermissions,
			depositTargets,
		] = await Promise.all([
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
			ActivityItem.findAll({
				where: { communityId },
				attributes: ['id', 'kind', 'actorId', 'pubId', 'payload', 'createdAt'],
				order: [['createdAt', 'DESC']],
				limit: 50_000,
				transaction: trx,
			}),
			CommunityBan.findAll({
				where: { communityId },
				transaction: trx,
			}),
			PublicPermissions.findAll({
				where: { communityId },
				transaction: trx,
			}),
			DepositTarget.findAll({
				where: { communityId },
				attributes: ['id', 'communityId', 'doiPrefix', 'service', 'createdAt'],
				transaction: trx,
			}),
		]);

		console.log('[communityExport] getCommunityData: main queries done, fetching facets');
		const facets = await fetchFacetsForScopeIds({
			community: [communityId],
			collection: collections.map((c) => c.id),
		});

		console.log('[communityExport] getCommunityData: facets done, building result');

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
			activityItems: activityItems.map((a) => a.toJSON()),
			communityBans: communityBans.map((b) => b.toJSON()),
			publicPermissions: publicPermissions.map((p) => p.toJSON()),
			depositTargets: depositTargets.map((d) => d.toJSON()),
		};
	});

	console.log('[communityExport] getCommunityData: transaction complete');
	return result;
};

const getPubs = async (communityId: string) => {
	console.log(`[communityExport] getPubs: starting for community ${communityId}`);
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

	console.log(`[communityExport] getPubs: found ${pubs.length} pubs`);
	return pubs;
};

export const communityExportTask = async ({
	communityId,
	key,
	workerTaskId,
	requestedByEmail,
}: {
	communityId: string;
	key: string;
	workerTaskId?: string;
	requestedByEmail?: string;
}) => {
	const startTime = performance.now();
	devTools.getMemoryStats();

	console.log(
		`[communityExport] communityExportTask: starting for community ${communityId}, key=${key}`,
	);

	// get community data + all pubs first

	let [communityData, pubs] = await Promise.all([
		getCommunityData(communityId),
		getPubs(communityId),
	]);

	console.log(`[communityExport] communityExportTask: data fetched, ${pubs.length} pubs`);

	// Capture title before communityData is nulled during streaming
	const communityTitle = communityData.community?.title ?? 'your community';

	console.log(`Found ${pubs.length} pubs`);

	const pubReadStream = await createPubStream(pubs, BATCH_SIZE);
	const pubsJsonTransform = createPubsJsonTransform();
	const pubsJsonStream = pubReadStream.pipe(pubsJsonTransform);

	const archiveStream = archiver('zip', { zlib: { level: 6 } });

	const pubTracker = devTools.createMemoryTracker(pubReadStream, BATCH_SIZE);
	const jsonTracker = devTools.createMemoryTracker(pubsJsonTransform, BATCH_SIZE);

	// Add categorized JSON files for community-level data
	const addJson = (name: string, data: unknown) => {
		archiveStream.append(JSON.stringify(data, null, 2), { name: `data/${name}` });
	};

	addJson('community.json', communityData.community);
	addJson('collections.json', communityData.collections);
	addJson('pages.json', communityData.pages);
	addJson('activity.json', communityData.activityItems);
	addJson('community-bans.json', communityData.communityBans);
	addJson('public-permissions.json', communityData.publicPermissions);
	addJson('deposit-targets.json', communityData.depositTargets);

	// Pubs are streamed into data/pubs.json
	archiveStream.append(pubsJsonStream, {
		name: 'data/pubs.json',
	});

	// Wait until the pubs JSON stream is fully processed before
	// generating HTML files and starting S3 upload.
	pubsJsonStream.on('end', async () => {
		console.log('[communityExport] Pubs JSON stream ended, generating HTML files');
		try {
			await generatePubHtmlFiles(communityId, archiveStream);
		} catch (e) {
			console.error('[communityExport] Error generating HTML files:', e);
		}
		archiveStream.finalize();
		// free up memory
		// @ts-expect-error blah blah
		communityData = null;
	});

	const communityArchiveStream = new PassThrough();
	archiveStream.pipe(communityArchiveStream);

	// Upload to S3 (private — no public-read ACL)
	const s3Key = `${key}.zip`;
	try {
		await exportsClient.uploadFileSplit(s3Key, communityArchiveStream, {
			queueSize: 10,
		});
	} catch (e) {
		console.error(`Something went wrong while uploading:`, e);
		throw e;
	}

	console.log(`[communityExport] Uploaded archive to ${s3Key}`);

	// Generate a presigned URL (7-day expiry, rewritten to assets.pubpub.org)
	console.log('[communityExport] Generating presigned URL');
	const downloadUrl = await exportsClient.getPresignedUrl(s3Key);
	console.log('[communityExport] Presigned URL generated');

	// set final result in worker task (replacing progress info)
	if (workerTaskId) {
		try {
			await updateWorkerTask({
				id: workerTaskId,
				body: {
					output: downloadUrl,
				},
			});
			console.log('Updated worker task with final download URL');
		} catch (error) {
			console.error('Failed to update worker task with final URL:', error);
		}
	}

	// Send email notification
	if (requestedByEmail) {
		try {
			await sendCommunityExportReadyEmail({
				toEmail: requestedByEmail,
				communityTitle,
				downloadUrl,
			});
		} catch (emailError) {
			console.error(`[communityExport] Failed to send export-ready email:`, emailError);
		}
	}

	devTools.logStats(startTime, pubTracker, jsonTracker);
	const endTime = performance.now();
	console.log(`Time taken to archive: ${endTime - startTime} milliseconds`);

	return downloadUrl;
};
