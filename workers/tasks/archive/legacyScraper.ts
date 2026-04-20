/**
 * LEGACY: Live HTML scraping approach for community export.
 *
 * This code fetched rendered pages from the live site via HTTP, parsed the HTML,
 * downloaded assets, and bundled everything into a zip. It was replaced by internal
 * HTML generation from ProseMirror doc JSON (see generatePubHtmlFiles in communityExport.tsx).
 *
 * Kept for reference. Not imported anywhere.
 */

import type { Pub } from 'server/models';

import { Readable } from 'stream';

import { env } from 'server/env';
import { updateWorkerTask } from 'server/workerTask/queries';
import { communityUrl } from 'utils/canonicalUrls';

import { createSiteDownloaderTransform, generateAssetUrl } from './siteDownloaderTransform';

// progress tracking utilities
export class ProgressTracker {
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

// create multiple readable streams that generate URLs for public pages, collections, and all pub releases
export const createUrlStreams = (communityData: any, pubs: Pub[], numStreams: number) => {
	const communityHost =
		communityData.community.domain || `${communityData.community.subdomain}.pubpub.org`;
	const baseUrl =
		env.NODE_ENV === 'production' ? communityUrl(communityData.community) : 'http://app:3000';

	console.log(
		`[archive] createUrlStreams: baseUrl=${baseUrl}, communityHost=${communityHost}, NODE_ENV=${env.NODE_ENV}`,
	);

	const urls: string[] = [];
	const param = '?pubpubArchiveBot=1';

	const publicPages = communityData.pages.filter((page: any) => page.isPublic);
	const publicCollections = communityData.collections.filter((c: any) => c.isPublic);
	const pubsWithReleases = pubs.filter((p) => p.releases && p.releases.length > 0);

	console.log(
		`[archive] createUrlStreams: ${publicPages.length} public pages, ${publicCollections.length} public collections, ${pubsWithReleases.length} pubs with releases`,
	);

	// add public pages
	publicPages.forEach((page: any) => {
		// home page
		if (!page.slug) {
			urls.push(`${baseUrl}/`);
			return;
		}
		urls.push(`${baseUrl}/${page.slug}${param}`);
	});

	// add public collections
	publicCollections.forEach((collection: any) => {
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
		communityHost,
	};
};

const ASSET_URL_PATTERN = /"https:\/\/assets\.pubpub\.org\/[a-z0-9]*\/[0-9]*\.[a-zA-Z]+"/g;

export const transformAssetLinksInViewDataJSON = (startTag: any, pageUrl: URL) => {
	const viewDataAttr = startTag.attrs.find((attr: any) => attr.name === 'data-json');

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

/**
 * Example usage (was called inside communityExportTask):
 *
 *   const begin = () => {
 *       const { urlStreams, totalUrls, communityHost } = createUrlStreams(communityData, pubs, numUrlStreams);
 *       const sharedAssetUrls = new Set<string>();
 *       let nCompletedStreams = 0;
 *       const totalStreams = urlStreams.length;
 *       const endUrlStream = () => {
 *           if (++nCompletedStreams === totalStreams) {
 *               archiveStream.finalize();
 *           }
 *       };
 *
 *       let progressTracker: ProgressTracker | null = null;
 *       if (workerTaskId) {
 *           progressTracker = new ProgressTracker(workerTaskId, totalUrls);
 *       }
 *
 *       urlStreams.forEach((urlStream, index) => {
 *           urlStream
 *               .pipe(createSiteDownloaderTransform({
 *                   headers: { 'User-Agent': 'PubPub-Archive-Bot/1.0', Host: communityHost },
 *                   onStartTag: transformAssetLinksInViewDataJSON,
 *                   progressTracker,
 *                   sharedAssetUrls,
 *               }))
 *               .on('data', (file) => archiveStream.append(file.stream, { name: file.name }))
 *               .on('end', () => endUrlStream())
 *               .on('error', (err) => { console.error(err); endUrlStream(); });
 *       });
 *   };
 */
