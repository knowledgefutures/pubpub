import cheerio from 'cheerio';

type BrandAsset = {
	label: string;
	url: string;
	type: 'image' | 'color' | 'text';
};

type BrandResult = {
	domain: string;
	siteTitle: string | null;
	siteDescription: string | null;
	assets: BrandAsset[];
};

const TIMEOUT_MS = 8000;

const fetchPage = async (url: string): Promise<string | null> => {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
		const res = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; PubPub/7.0; +https://pubpub.org)',
				Accept: 'text/html,application/xhtml+xml',
			},
			redirect: 'follow',
			signal: controller.signal,
		});
		clearTimeout(timer);
		if (!res.ok) return null;
		const ct = res.headers.get('content-type') || '';
		if (!ct.includes('text/html') && !ct.includes('xhtml')) return null;
		return await res.text();
	} catch {
		return null;
	}
};

const fetchCss = async (url: string): Promise<string | null> => {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
		const res = await fetch(url, {
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PubPub/7.0; +https://pubpub.org)' },
			redirect: 'follow',
			signal: controller.signal,
		});
		clearTimeout(timer);
		if (!res.ok) return null;
		const text = await res.text();
		// Only return first 200KB to avoid huge files
		return text.slice(0, 200_000);
	} catch {
		return null;
	}
};

const resolveUrl = (raw: string | undefined | null, base: string): string | null => {
	if (!raw) return null;
	try {
		return new URL(raw, base).href;
	} catch {
		return null;
	}
};

const isValidImageUrl = (url: string | null): url is string => {
	if (!url) return false;
	// Allow data: SVG URIs (from inline SVG serialization)
	if (url.startsWith('data:image/svg+xml')) return true;
	if (url.startsWith('data:')) return false;
	try {
		const u = new URL(url);
		return u.protocol === 'https:' || u.protocol === 'http:';
	} catch {
		return false;
	}
};

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const normalizeColor = (raw: string | null | undefined): string | null => {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (HEX_COLOR_RE.test(trimmed)) return trimmed;
	// rgb(r, g, b) or rgba(r, g, b, a)
	const rgbMatch = trimmed.match(
		/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i,
	);
	if (rgbMatch) {
		const [, r, g, b] = rgbMatch;
		return `#${[r, g, b].map((c) => Number(c).toString(16).padStart(2, '0')).join('')}`;
	}
	// Bare r,g,b (used in modern CSS: --color: 0,50,189)
	const bareMatch = trimmed.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
	if (bareMatch) {
		const [, r, g, b] = bareMatch;
		const nums = [Number(r), Number(g), Number(b)];
		if (nums.every((n) => n >= 0 && n <= 255)) {
			return `#${nums.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
		}
	}
	return null;
};

const SKIP_COLORS = new Set([
	'#000',
	'#000000',
	'#fff',
	'#ffffff',
	'#333',
	'#333333',
	'#666',
	'#666666',
	'#999',
	'#999999',
	'#ccc',
	'#cccccc',
	'#eee',
	'#eeeeee',
	'#f5f5f5',
	'#f7f7f7',
	'#f2f2f2',
	'#e2e2e2',
]);

/** Extract brand-ish colors from a CSS string (inline <style> or linked stylesheet) */
const extractColorsFromCss = (css: string): { label: string; color: string }[] => {
	const results: { label: string; color: string }[] = [];
	const seen = new Set<string>();

	const add = (label: string, color: string) => {
		const key = color.toLowerCase();
		if (seen.has(key) || SKIP_COLORS.has(key)) return;
		seen.add(key);
		results.push({ label, color });
	};

	// CSS custom properties with brand-ish names — capture any value after the colon
	const brandVarRe =
		/--[\w-]*(?:brand|primary|accent|main|theme|header|nav|banner|spot|highlight|link|action|cta)[\w-]*:\s*([^;}{]+)/gi;
	for (const m of css.matchAll(brandVarRe)) {
		const c = normalizeColor(m[1]);
		if (c) add('CSS Brand Variable', c);
	}

	// Colors in :root or html selectors — match all variable declarations
	const rootBlocks = [
		...css.matchAll(/:root\s*\{([^}]+)\}/gi),
		...css.matchAll(/html\s*\{([^}]+)\}/gi),
	];
	for (const rootBlockMatch of rootBlocks) {
		const block = rootBlockMatch[1];
		for (const m of block.matchAll(/--[\w-]+:\s*([^;}{]+)/g)) {
			const c = normalizeColor(m[1]);
			if (c) add('Root CSS Variable', c);
		}
	}

	// background-color on body, header, nav, .header, .nav, .banner — allow more color formats
	const selectorPattern =
		/(?:body|header|nav|\.header|\.nav|\.banner|\.navbar|\.site-header)\s*\{[^}]*?background(?:-color)?:\s*([^;}{]+)/gi;
	for (const m of css.matchAll(selectorPattern)) {
		const c = normalizeColor(m[1]);
		if (c) add('CSS Background', c);
	}

	// color property on links, buttons
	const linkColorPattern =
		/(?:a(?:\s|,|:)|\bbutton|\bbtn|\.btn)\s*[^}]*?(?:^|[{;])\s*color:\s*([^;}{]+)/gi;
	for (const m of css.matchAll(linkColorPattern)) {
		const c = normalizeColor(m[1]);
		if (c) add('Link/Button Color', c);
	}

	return results;
};

export const fetchBrandAssets = async (domain: string): Promise<BrandResult> => {
	const baseUrl = `https://${domain}`;
	const result: BrandResult = { domain, siteTitle: null, siteDescription: null, assets: [] };
	const seen = new Set<string>();

	const addAsset = (label: string, url: string, type: 'image' | 'color' | 'text') => {
		const key = `${type}:${url}`;
		if (seen.has(key)) return;
		seen.add(key);
		result.assets.push({ label, url, type });
	};

	const html = await fetchPage(baseUrl);
	if (!html) return result;

	const $ = cheerio.load(html);

	// ── Text: titles & descriptions ──
	const ogSiteName = $('meta[property="og:site_name"]').attr('content')?.trim();
	const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
	const pageTitle = $('title').first().text().trim();

	result.siteTitle = ogSiteName || ogTitle || pageTitle || null;

	if (ogSiteName) addAsset('Site Name (og:site_name)', ogSiteName, 'text');
	if (ogTitle && ogTitle !== ogSiteName) addAsset('Page Title (og:title)', ogTitle, 'text');
	if (pageTitle && pageTitle !== ogSiteName && pageTitle !== ogTitle) {
		addAsset('Page Title (<title>)', pageTitle, 'text');
	}

	const ogDesc = $('meta[property="og:description"]').attr('content')?.trim();
	const metaDesc = $('meta[name="description"]').attr('content')?.trim();
	result.siteDescription = ogDesc || metaDesc || null;

	if (ogDesc) addAsset('Description (og:description)', ogDesc, 'text');
	if (metaDesc && metaDesc !== ogDesc) addAsset('Description (meta)', metaDesc, 'text');

	// ── Images ──

	// OG Image
	const ogImage = resolveUrl(
		$('meta[property="og:image:secure_url"]').attr('content') ||
			$('meta[property="og:image"]').attr('content'),
		baseUrl,
	);
	if (isValidImageUrl(ogImage)) addAsset('OG Image', ogImage, 'image');

	// Twitter image
	const twImage = resolveUrl(
		$('meta[name="twitter:image"]').attr('content') ||
			$('meta[name="twitter:image:src"]').attr('content'),
		baseUrl,
	);
	if (isValidImageUrl(twImage)) addAsset('Twitter Image', twImage, 'image');

	// Apple touch icon
	const appleIcon = resolveUrl(
		$('link[rel="apple-touch-icon"]').attr('href') ||
			$('link[rel="apple-touch-icon-precomposed"]').attr('href'),
		baseUrl,
	);
	if (isValidImageUrl(appleIcon)) addAsset('Apple Touch Icon', appleIcon, 'image');

	// Favicon (larger variants first)
	$('link[rel="icon"], link[rel="shortcut icon"]').each((_i, el) => {
		const href = resolveUrl($(el).attr('href'), baseUrl);
		const sizes = $(el).attr('sizes') || '';
		if (isValidImageUrl(href)) {
			addAsset(`Favicon${sizes ? ` (${sizes})` : ''}`, href, 'image');
		}
	});

	// Fallback favicon
	if (!result.assets.some((a) => a.label.startsWith('Favicon'))) {
		addAsset('Favicon (default)', `${baseUrl}/favicon.ico`, 'image');
	}

	// Site logo in header/banner/nav areas (including SVG sources)
	$(
		'header img, nav img, [role="banner"] img, .logo img, img.logo, a[class*="logo"] img, img[class*="logo"], img[alt*="logo" i], [id*="logo" i] img, img[id*="logo" i]',
	).each((_i, el) => {
		const src = resolveUrl($(el).attr('src'), baseUrl);
		if (isValidImageUrl(src)) addAsset('Site Logo', src, 'image');
	});

	// SVG logos referenced via <img src="*.svg"> or <object>/<embed> in header/nav
	$(
		'header img[src$=".svg"], nav img[src$=".svg"], [class*="logo"] img[src$=".svg"], header object[data$=".svg"], nav object[data$=".svg"]',
	).each((_i, el) => {
		const src = resolveUrl($(el).attr('src') || $(el).attr('data'), baseUrl);
		if (isValidImageUrl(src)) addAsset('SVG Logo', src, 'image');
	});

	// Inline <svg> elements with logo/icon/brand class or id, or inside logo containers
	const svgSelectors = [
		'svg[class*="logo" i]',
		'svg[class*="icon" i]',
		'svg[class*="brand" i]',
		'svg[id*="logo" i]',
		'svg[id*="icon" i]',
		'[class*="logo" i] svg',
		'[id*="logo" i] svg',
		'header svg',
		'nav svg',
	].join(', ');
	const svgSeen = new Set<string>();
	$(svgSelectors).each((_i, el) => {
		const svgHtml = $.html(el);
		if (!svgHtml || svgHtml.length > 50_000) return; // Skip huge SVGs
		// Dedupe by content hash (first 200 chars)
		const key = svgHtml.slice(0, 200);
		if (svgSeen.has(key)) return;
		svgSeen.add(key);
		// Build data URI
		const encoded = Buffer.from(svgHtml).toString('base64');
		const dataUri = `data:image/svg+xml;base64,${encoded}`;
		const cls = $(el).attr('class') || '';
		const label = cls ? `Inline SVG (${cls.slice(0, 30)})` : 'Inline SVG';
		addAsset(label, dataUri, 'image');
	});

	// CSS background-image logos in header/nav elements
	$('header, nav, [role="banner"], .logo, [class*="logo"], [id*="logo"]').each((_i, el) => {
		const style = $(el).attr('style') || '';
		const bgImgMatch = style.match(
			/background(?:-image)?:\s*url\(\s*['"]?([^'")\s]+)['"]?\s*\)/,
		);
		if (bgImgMatch) {
			const src = resolveUrl(bgImgMatch[1], baseUrl);
			if (isValidImageUrl(src)) addAsset('Logo (CSS background)', src, 'image');
		}
	});

	// Prominent page images (hero, main content) — first few large images
	let pageImageCount = 0;
	$(
		'main img, [role="main"] img, .hero img, [class*="hero"] img, .banner img, article img, section img',
	).each((_i, el) => {
		if (pageImageCount >= 6) return;
		const src = resolveUrl($(el).attr('src'), baseUrl);
		if (!isValidImageUrl(src)) return;
		// Skip tiny images (tracking pixels, icons)
		const w = parseInt($(el).attr('width') || '0', 10);
		const h = parseInt($(el).attr('height') || '0', 10);
		if ((w > 0 && w < 50) || (h > 0 && h < 50)) return;
		const alt = $(el).attr('alt') || '';
		const label = alt ? `Page Image: ${alt.slice(0, 40)}` : 'Page Image';
		addAsset(label, src, 'image');
		pageImageCount++;
	});

	// ── Colors from meta tags ──
	const themeColor = normalizeColor($('meta[name="theme-color"]').attr('content'));
	if (themeColor) addAsset('Theme Color', themeColor, 'color');

	const tileColor = normalizeColor($('meta[name="msapplication-TileColor"]').attr('content'));
	if (tileColor) addAsset('Tile Color', tileColor, 'color');

	// ── Colors from inline styles on structural elements ──
	$('header, nav, [role="banner"], .header, .navbar, .site-header').each((_i, el) => {
		const style = $(el).attr('style') || '';
		const bgMatch = style.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\))/);
		if (bgMatch) {
			const c = normalizeColor(bgMatch[1]);
			if (c) addAsset('Header Background', c, 'color');
		}
	});

	// ── Colors from inline <style> blocks ──
	$('style').each((_i, el) => {
		const css = $(el).html() || '';
		for (const { label, color } of extractColorsFromCss(css)) {
			addAsset(label, color, 'color');
		}
	});

	// ── Colors from linked stylesheets (fetch up to 3) ──
	const cssLinks: string[] = [];
	$('link[rel="stylesheet"]').each((_i, el) => {
		if (cssLinks.length >= 3) return;
		const href = resolveUrl($(el).attr('href'), baseUrl);
		if (href) cssLinks.push(href);
	});
	const cssResults = await Promise.all(cssLinks.map((url) => fetchCss(url)));
	for (const css of cssResults) {
		if (!css) continue;
		for (const { label, color } of extractColorsFromCss(css)) {
			addAsset(label, color, 'color');
		}
	}

	return result;
};
