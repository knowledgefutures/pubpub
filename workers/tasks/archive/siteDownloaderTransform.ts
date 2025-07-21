import { PassThrough, Readable, Transform, TransformOptions } from 'node:stream';
import { RewritingStream } from 'parse5-html-rewriting-stream';
import type { StartTag } from 'parse5-sax-parser';

import type * as streamWeb from 'node:stream/web';

// https://stackoverflow.com/questions/76958222/how-to-pipe-response-from-nodejs-fetch-response-to-an-express-response#comment139165202_77589444
declare global {
	interface Response {
		readonly body: streamWeb.ReadableStream<Uint8Array> | null;
	}
}

const allowedExportFormats = ['formatted', 'pdf', 'jats'];

export type SiteDownloaderTransformConfig = TransformOptions & {
	assetDir?: string;
	assetUrlFilter?: (url: string) => boolean;
	headers?: Record<string, string>;
};

const isLinkTag = (tag: any) => tag.tagName === 'link';

const isStylesheetTag = (tag: any) =>
	tag.tagName === 'link' &&
	tag.attrs.some((attr: any) => attr.name === 'rel' && attr.value === 'stylesheet');

const isIconTag = (tag: any) =>
	tag.tagName === 'link' &&
	tag.attrs.some((attr: any) => attr.name === 'rel' && attr.value === 'icon');

const transformAnchorTag = (tag: any, pageUrl: URL) => {
	const href = tag.attrs.find((attr: any) => attr.name === 'href');
	if (href?.value === undefined) {
		return;
	}
	if (href.value.startsWith(pageUrl.origin)) {
		href.value = href.value.replace(pageUrl.origin, '');
	}
};

const transformAssetTag = (
	tag: any,
	pageUrl: URL,
	config: SiteDownloaderTransformConfig,
): { assetUrl: URL; assetPath: string } | null => {
	if (isLinkTag(tag) && !isStylesheetTag(tag) && !isIconTag(tag)) {
		return null;
	}
	const assetSrc = tag.attrs.find((attr: any) => attr.name === 'src' || attr.name === 'href');
	if (assetSrc === undefined) {
		return null;
	}
	const assetUrl = new URL(assetSrc.value, pageUrl);
	if (config.assetUrlFilter?.(assetUrl.href) === false) {
		return null;
	}
	const assetDir = `/${config.assetDir}/${assetUrl.hostname.replace(/\./g, '_')}`;
	const assetPath = `${assetDir}${assetUrl.pathname}`;
	tag.attrs = tag.attrs.map((attr: any) =>
		attr.name === assetSrc.name ? { ...attr, value: assetPath } : attr,
	);
	return { assetUrl, assetPath };
};

const ogImageTags = ['og:image', 'twitter:image', 'og:image:url'];

const transformOgImageIshTag = (tag: any, pageUrl: URL, config: SiteDownloaderTransformConfig) => {
	const content = tag.attrs.find((attr: any) => attr.name === 'content');
	if (content === undefined) {
		return null;
	}

	// property contains image
	const isOgImageIshTag = tag.attrs.some(
		(attr: any) =>
			(attr.name === 'property' || attr.name === 'name') && ogImageTags.includes(attr.value),
	);
	if (!isOgImageIshTag) {
		return null;
	}

	const assetUrl = new URL(content.value, pageUrl);
	if (config.assetUrlFilter?.(assetUrl.href) === false) {
		return null;
	}
	const assetDir = `/${config.assetDir}/${assetUrl.hostname.replace(/\./g, '_')}`;
	const assetPath = `${assetDir}${assetUrl.pathname}`;
	tag.attrs = tag.attrs.map((attr: any) =>
		attr.name === content.name ? { ...attr, value: assetPath } : attr,
	);
	return { assetUrl, assetPath };
};

const defaultConfig: SiteDownloaderTransformConfig = {
	assetDir: 'assets',
	assetUrlFilter: () => true,
	headers: {},
};

export class SiteDownloaderTransform extends Transform {
	static #assetUrls = new Set<string>();
	static hasAssetUrl(url: string | URL) {
		return this.#assetUrls.has(url.toString());
	}

	#config: SiteDownloaderTransformConfig;

	constructor(config?: Partial<SiteDownloaderTransformConfig>) {
		const finalConfig = { ...defaultConfig, ...config };
		super({ ...finalConfig, objectMode: true });
		this.#config = finalConfig;
	}

	async #fetch(url: string | URL) {
		return fetch(url, {
			headers: this.#config.headers,
		});
	}

	#pushAsset(assetUrl: URL, assetPath: string) {
		if (SiteDownloaderTransform.hasAssetUrl(assetUrl.href)) {
			console.log(`Skipping ${assetUrl.href} because it's already been pushed`);
			return;
		}

		const stream = new PassThrough();

		this.push({ name: assetPath, stream });

		this.#fetch(assetUrl)
			.then((response) => {
				Readable.fromWeb(response.body!).pipe(stream);
			})
			.catch((err) => {
				console.error(`Failed to fetch asset ${assetUrl.href}:`, err);
				// If the asset fetch fails, we still want to push an empty stream
				// so that the archive can be created without errors.
				stream.destroy();
			});

		SiteDownloaderTransform.#assetUrls.add(assetUrl.href);
	}

	transformTag(tag: StartTag, pageUrl: URL) {
		switch (tag.tagName) {
			case 'div': {
				const styleAttr = tag.attrs.find((attr: any) => attr.name === 'style');
				if (!styleAttr || !styleAttr.value) {
					break;
				}
				const style = styleAttr.value.match(/^background-image:url\('(.*)'\)$/);

				const backgroundImage = style?.[1];
				if (!backgroundImage) {
					break;
				}

				const backgroundImageUrl = new URL(backgroundImage, pageUrl);
				if (this.#config.assetUrlFilter?.(backgroundImageUrl.href) === false) {
					break;
				}

				const assetDir = `/${this.#config.assetDir}/${backgroundImageUrl.hostname.replace(
					/\./g,
					'_',
				)}`;
				const assetPath = `${assetDir}${backgroundImageUrl.pathname}`;

				console.log(`Pushing background image: ${backgroundImageUrl.href}`);
				this.#pushAsset(backgroundImageUrl, assetPath);

				break;
			}
			case 'a': {
				const { exportAvailable, exportFormat, exportHref } = tag.attrs.reduce(
					(acc, attr) => {
						if (attr.name === 'data-export-available' && attr.value !== 'false') {
							acc.exportAvailable = true;
						}
						if (attr.name === 'data-export-format') {
							acc.exportFormat = attr.value;
						}
						if (attr.name === 'href') {
							acc.exportHref = attr.value;
						}
						return acc;
					},
					{
						exportAvailable: false,
						exportFormat: '',
						exportHref: '',
					},
				);
				if (exportAvailable && allowedExportFormats.includes(exportFormat)) {
					const result = transformAssetTag(tag, pageUrl, this.#config);
					if (result === null) {
						console.log('Skipping asset tag:', tag.attrs);
						break;
					}
					console.log(`Pushing ${exportFormat} export:`, exportHref);
					this.#pushAsset(result.assetUrl, result.assetPath);
				}
				transformAnchorTag(tag, pageUrl);
				break;
			}

			case 'meta': {
				const result = transformOgImageIshTag(tag, pageUrl, this.#config);
				if (result === null) {
					break;
				}
				console.log('Pushing og imageish asset:', result.assetUrl.href);
				this.#pushAsset(result.assetUrl, result.assetPath);
				break;
			}
			case 'img':
			case 'script':
			case 'link': {
				const result = transformAssetTag(tag, pageUrl, this.#config);
				if (result === null) {
					break;
				}
				console.log('Pushing asset:', result.assetUrl.href);
				this.#pushAsset(result.assetUrl, result.assetPath);
				break;
			}
			default: {
				break;
			}
		}
	}

	// eslint doesn't recognize BufferEncoding
	// eslint-disable-next-line no-undef
	async _transform(url: string, _: BufferEncoding, callback: (error?: Error | null) => void) {
		try {
			// need to get primary urls running at / instead of /blah_blah_org
			const pageUrl = new URL(url);
			const pagePath =
				pageUrl.pathname + (pageUrl.pathname.endsWith('/') ? '' : '/') + 'index.html';

			console.log('Fetching page:', url.toString());

			const response = await this.#fetch(url);

			if (!response.ok) {
				throw new Error(`Failed to fetch ${url}: ${response.status}`);
			}

			const htmlRewriter = new RewritingStream();

			htmlRewriter.on('startTag', (tag) => {
				this.transformTag(tag, pageUrl);
				htmlRewriter.emitStartTag(tag);
			});

			const htmlStreamDecoder = new TextDecoder('utf8');
			const htmlStream = Readable.fromWeb(response.body!)
				.map((chunk: Uint8Array) => htmlStreamDecoder.decode(chunk, { stream: true }))
				.pipe(htmlRewriter);

			this.push({ name: pagePath, stream: htmlStream });

			htmlStream.on('end', async () => {
				try {
					callback();
				} catch (err) {
					callback(err as Error);
				}
			});

			htmlStream.on('error', callback);
		} catch (err) {
			callback(err as Error);
		}
	}
}

export const createSiteDownloaderTransform = (config?: Partial<SiteDownloaderTransformConfig>) => {
	return new SiteDownloaderTransform(config);
};
