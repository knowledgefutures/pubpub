import type { Maybe } from 'types';

import { atobUniversal } from './strings';

type ResizerFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

type ParsedResizeUrl = {
	assetsUrl: string;
	width?: number;
	height?: number;
	fit?: ResizerFit;
};

const resizableExtensions = ['jpg', 'jpeg', 'png'];

/**
 * Maps Sharp-style fit values to Fastly IO fit parameter values.
 *
 * Sharp `inside`/`contain` → Fastly `bounds` (fit within dimensions)
 * Sharp `cover` → Fastly `cover` (cover dimensions, may crop)
 * Sharp `outside` → Fastly `cover` (closest equivalent; ensures coverage)
 * Sharp `fill` → Fastly `bounds` (no stretch equivalent; bounds is safest)
 */
const mapFitToFastly = (fit: ResizerFit): string => {
	switch (fit) {
		case 'inside':
		case 'contain':
		case 'fill':
			return 'bounds';
		case 'cover':
		case 'outside':
			return 'cover';
		default:
			return 'bounds';
	}
};

/**
 * Parses any PubPub image URL into a structured result containing the
 * underlying assets.pubpub.org URL and any resize parameters.
 *
 * Handles:
 * - resize-v3.pubpub.org (Sharp base64 JSON)
 * - resize.pubpub.org v1 (Thumbor path)
 * - assets.pubpub.org with query params (strips them)
 * - assets.pubpub.org (clean passthrough)
 * - anything else (passthrough)
 */
const parseResizeUrl = (url: string): ParsedResizeUrl => {
	// Handle resize-v3.pubpub.org (Sharp base64 format)
	if (url.startsWith('https://resize-v3.pubpub.org/')) {
		try {
			const imageRequest = JSON.parse(
				atobUniversal(url.replace('https://resize-v3.pubpub.org/', '')),
			);
			const assetsUrl = `https://assets.pubpub.org/${imageRequest.key}`;
			const resize = imageRequest.edits?.resize;
			if (resize) {
				return {
					assetsUrl,
					width: resize.width || undefined,
					height: resize.height || undefined,
					fit: (resize.fit as ResizerFit) || 'inside',
				};
			}
			return { assetsUrl };
		} catch {
			return { assetsUrl: url };
		}
	}

	// Handle resize.pubpub.org v1 (Thumbor format)
	// Format: https://resize.pubpub.org/fit-in/WxH/key/file.ext
	if (url.startsWith('https://resize.pubpub.org/')) {
		const afterHost = url.replace('https://resize.pubpub.org/', '');
		const parts = afterHost.split('/');
		const fit: ResizerFit = parts.includes('fit-in') ? 'inside' : 'cover';

		for (let i = 0; i < parts.length; i++) {
			if (/^\d+x\d+$/.test(parts[i])) {
				const [w, h] = parts[i].split('x').map(Number);
				const assetKey = parts.slice(i + 1).join('/');
				return {
					assetsUrl: `https://assets.pubpub.org/${assetKey}`,
					width: w || undefined,
					height: h || undefined,
					fit,
				};
			}
		}
		return { assetsUrl: url };
	}

	// Handle assets.pubpub.org with Fastly IO query params (strip them)
	if (url.startsWith('https://assets.pubpub.org/') && url.includes('?')) {
		const [base, queryString] = url.split('?');
		const params = new URLSearchParams(queryString);
		// Only strip if the params look like Fastly IO resize params
		if (params.has('width') || params.has('height') || params.has('fit')) {
			return { assetsUrl: base };
		}
	}

	return { assetsUrl: url };
};

/**
 * Extracts the underlying assets.pubpub.org URL from any resize URL format,
 * discarding resize parameters. Only transforms URLs that are recognized
 * resize formats (resize.pubpub.org, resize-v3.pubpub.org, or
 * assets.pubpub.org with Fastly IO params). All other URLs pass through
 * unchanged.
 */
export const extractAssetsUrl = (url: Maybe<string>): string => {
	if (!url) return '';
	return parseResizeUrl(url).assetsUrl;
};

/**
 * Generates a Fastly IO resize URL for an assets.pubpub.org image.
 *
 * Also normalizes legacy resize.pubpub.org and resize-v3.pubpub.org URLs
 * to the underlying assets.pubpub.org URL before applying Fastly IO params.
 *
 * The `fit` parameter uses Sharp terminology for call-site compatibility,
 * and is mapped to the equivalent Fastly IO value internally.
 */
export const getResizedUrl = (
	url: Maybe<string>,
	fit: ResizerFit,
	width?: number,
	height?: number,
) => {
	const assetsUrl = extractAssetsUrl(url);

	if (!assetsUrl || !assetsUrl.startsWith('https://assets.pubpub.org/')) {
		return assetsUrl || '';
	}

	const extension = assetsUrl.split('.').pop()!.toLowerCase();
	if (resizableExtensions.indexOf(extension) === -1) {
		return assetsUrl;
	}

	const params = new URLSearchParams();
	if (width) params.set('width', String(width));
	if (height) params.set('height', String(height));
	params.set('fit', mapFitToFastly(fit));

	return `${assetsUrl}?${params.toString()}`;

	/* !!Just for dev testing!! */
	/* Remove the line below anduncomment the return line above */
	/* before pushing to prod */
	// return `${assetsUrl.replace('assets.pubpub', 'assets2.pubpub')}?${params.toString()}`;
};

export const getSrcSet = (url: string, fit: ResizerFit, width: number) => {
	const pixelDensities = [1, 2, 3];
	return pixelDensities
		.map((density) => {
			const resizedUrl = getResizedUrl(url, fit, width);
			if (density === 1 || !resizedUrl.includes('?')) {
				return `${resizedUrl} ${density}x`;
			}
			return `${resizedUrl}&dpr=${density} ${density}x`;
		})
		.join(',');
};

/**
 * Returns the underlying assets.pubpub.org URL from any resize URL format.
 * Handles resize-v3.pubpub.org, resize.pubpub.org, and Fastly IO URLs.
 */
export const getAssetUrlFromResizedUrl = (resizedUrl: string) => {
	return extractAssetsUrl(resizedUrl);
};

/**
 * Converts any legacy resize URL to a Fastly IO URL, preserving the original
 * resize parameters (width, height, fit). Non-resize URLs are returned as-is.
 *
 * - resize-v3.pubpub.org: decodes the base64 JSON → extracts key, width, height, fit
 * - resize.pubpub.org v1: parses Thumbor path → extracts key, WxH, fit-in → inside
 * - anything else: returned unchanged via extractAssetsUrl
 */
export const convertResizeUrlToFastlyUrl = (url: string): string => {
	const { assetsUrl, width, height, fit } = parseResizeUrl(url);
	if (fit) {
		return getResizedUrl(assetsUrl, fit, width, height);
	}
	return assetsUrl;
};

/**
 * Replaces all legacy resize.pubpub.org and resize-v3.pubpub.org URLs in an
 * HTML string with Fastly IO equivalents, preserving the original resize
 * parameters (width, height, fit).
 *
 * Intended for use with layout HTML blocks that are rendered via
 * dangerouslySetInnerHTML and may contain hardcoded legacy resize URLs.
 */
export const normalizeResizeUrlsInHtml = (html: string): string => {
	// Match resize-v3.pubpub.org base64 URLs (non-greedy, stops at quote/space/angle bracket)
	const v3Pattern = /https:\/\/resize-v3\.pubpub\.org\/[A-Za-z0-9+/=]+/g;
	// Match resize.pubpub.org Thumbor URLs
	const v1Pattern = /https:\/\/resize\.pubpub\.org\/[^\s"'<>]+/g;

	return html
		.replace(v3Pattern, (match) => convertResizeUrlToFastlyUrl(match))
		.replace(v1Pattern, (match) => convertResizeUrlToFastlyUrl(match));
};
