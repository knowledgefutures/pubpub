import http from 'node:http';
import { type Browser, chromium } from 'playwright-core';

import { type OutlineNode, type PageBoxes, type PdfMeta, postProcessPdf } from './postprocess';
import { uploadPdfToS3 } from './s3';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 8080);
const MAX_CONCURRENCY = Number(process.env.MAX_CONCURRENCY ?? 4);
const ACCESS_KEY = process.env.ACCESS_KEY ?? '';
const BODY_LIMIT = Number(process.env.CONVERT_BODY_LIMIT ?? 50e6); // 50 MB
const PAGE_TIMEOUT_MS = Number(process.env.PAGE_TIMEOUT_MS ?? 120_000);

// Detect the system-installed Chromium / Chrome path.
// In the Docker image this comes from the Aptfile; on macOS use the default.
const CHROMIUM_PATH =
	process.env.CHROMIUM_PATH ??
	(process.platform === 'darwin'
		? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
		: '/usr/bin/chromium');

// ---------------------------------------------------------------------------
// Semaphore – caps concurrent PDF renders to avoid OOM
// ---------------------------------------------------------------------------
class Semaphore {
	private queue: Array<() => void> = [];
	private running = 0;
	constructor(private readonly max: number) {}

	async acquire(): Promise<void> {
		if (this.running < this.max) {
			this.running++;
			return;
		}
		return new Promise<void>((resolve) => this.queue.push(resolve));
	}

	release(): void {
		const next = this.queue.shift();
		if (next) {
			next(); // hand the slot to the next waiter
		} else {
			this.running--;
		}
	}

	get stats() {
		return { running: this.running, queued: this.queue.length };
	}
}

const sem = new Semaphore(MAX_CONCURRENCY);

// ---------------------------------------------------------------------------
// Browser lifecycle – one persistent Chromium for the life of the process
// ---------------------------------------------------------------------------
let browser: Browser;

async function launchBrowser(): Promise<Browser> {
	return chromium.launch({
		executablePath: CHROMIUM_PATH,
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage', // write shared-memory to /tmp instead of /dev/shm
			'--disable-gpu',
			'--single-process', // reduce memory footprint
		],
	});
}

// ---------------------------------------------------------------------------
// PDF conversion
//
// Mirrors the rendering flow from pubpub/pagedjs-cli's printer.js:
// 1. Load HTML, wait for fonts
// 2. Disable paged.js auto-mode, inject the polyfill
// 3. Hook paged.js events to collect per-page box data
// 4. Trigger paged.js preview(), wait for completion
// 5. Extract <meta> tags and heading outline from the DOM
// 6. Generate PDF via page.pdf()
// 7. Post-process: inject metadata, page boxes, and outline/bookmarks
// ---------------------------------------------------------------------------

// The paged.js polyfill is loaded from the CDN. Pin a known-good version.
const PAGEDJS_POLYFILL = 'https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.js';

// Heading tags to include in the PDF outline (matches pagedjs-cli defaults)
const OUTLINE_TAGS = ['h1', 'h2', 'h3'];

async function convertHtmlToPdf(html: string): Promise<Buffer> {
	const page = await browser.newPage();
	try {
		// Accumulate per-page box data from paged.js events
		const collectedPages: PageBoxes[] = [];

		// Expose callbacks that paged.js will invoke from the browser context.
		// Playwright's exposeFunction bridges browser→Node.
		await page.exposeFunction('__pubstashOnPage', (pageData: any) => {
			collectedPages.push(pageData.boxes);
		});

		// Load the HTML
		await page.setContent(html, { waitUntil: 'load', timeout: PAGE_TIMEOUT_MS });

		// Wait for all web fonts before paged.js measures text.
		// (Key fix from the pubpub/pagedjs-cli fork.)
		await page.evaluate(() => document.fonts.ready);

		// Disable paged.js auto-run so we can hook events first
		await page.evaluate(() => {
			(window as any).PagedConfig = (window as any).PagedConfig || {};
			(window as any).PagedConfig.auto = false;
		});

		// Inject the polyfill script
		await page.addScriptTag({ url: PAGEDJS_POLYFILL });

		// Hook paged.js events and trigger rendering
		await page.evaluate(() => {
			return new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(
					() => reject(new Error('paged.js rendering timed out')),
					120_000,
				);

				const polyfill = (window as any).PagedPolyfill;

				polyfill.on('page', (pg: any) => {
					const mediabox = pg.element.getBoundingClientRect();
					const cropbox = pg.pagebox.getBoundingClientRect();

					function pts(value: number) {
						return Math.round((CSS as any).px(value).to('pt').value * 100) / 100;
					}

					const boxes = {
						media: {
							width: pts(mediabox.width),
							height: pts(mediabox.height),
							x: 0,
							y: 0,
						},
						crop: {
							width: pts(cropbox.width),
							height: pts(cropbox.height),
							x: pts(cropbox.x) - pts(mediabox.x),
							y: pts(cropbox.y) - pts(mediabox.y),
						},
					};

					(window as any).__pubstashOnPage({ boxes });
				});

				polyfill.on('rendered', () => {
					clearTimeout(timeout);
					resolve();
				});

				polyfill.preview();
			});
		});

		// Wait for paged.js DOM to land
		await page.waitForSelector('.pagedjs_pages', { timeout: PAGE_TIMEOUT_MS });

		// Extract <meta> tags for PDF metadata
		const meta: PdfMeta = await page.evaluate(() => {
			const m: Record<string, string> = {};
			const title = document.querySelector('title');
			if (title) m.title = title.textContent?.trim() ?? '';
			for (const tag of Array.from(document.querySelectorAll('meta'))) {
				if (tag.name && tag.content) m[tag.name] = tag.content;
			}
			return m;
		});

		// Extract heading outline for PDF bookmarks
		const outline: OutlineNode[] = await page.evaluate((tags: string[]) => {
			function buildOutline(
				nodes: Element[],
				tagList: string[],
			): { title: string; id: string; children: any[] }[] {
				const result: { title: string; id: string; children: any[] }[] = [];
				const stack: {
					depth: number;
					node: { title: string; id: string; children: any[] };
				}[] = [];

				for (const el of nodes) {
					const depth = tagList.indexOf(el.tagName.toLowerCase());
					if (depth === -1) continue;

					const entry = {
						title: el.textContent?.trim() ?? '',
						id: el.id || '',
						children: [] as any[],
					};

					// Only include entries that have an id (required for PDF /Dest)
					if (!entry.id) continue;

					// Pop stack to find parent
					while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
						stack.pop();
					}

					if (stack.length > 0) {
						stack[stack.length - 1].node.children.push(entry);
					} else {
						result.push(entry);
					}

					stack.push({ depth, node: entry });
				}

				return result;
			}

			const headings = Array.from(document.querySelectorAll(tags.join(',')));
			return buildOutline(headings, tags);
		}, OUTLINE_TAGS);

		// Generate the raw PDF
		const rawPdf = await page.pdf({
			format: 'Letter',
			printBackground: true,
			preferCSSPageSize: true,
			margin: { top: 0, right: 0, bottom: 0, left: 0 },
		});

		// Post-process: inject metadata, page boxes, and outline
		const processed = await postProcessPdf(rawPdf, {
			meta,
			pages: collectedPages,
			outline,
		});

		return Buffer.from(processed);
	} finally {
		await page.close();
	}
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function readBody(req: http.IncomingMessage, limit: number): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		req.on('data', (chunk: Buffer) => {
			size += chunk.length;
			if (size > limit) {
				req.destroy();
				reject(new Error(`Request body exceeds limit of ${limit} bytes`));
			}
			chunks.push(chunk);
		});
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
		req.on('error', reject);
	});
}

function json(res: http.ServerResponse, status: number, body: unknown) {
	res.writeHead(status, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(body));
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const httpServer = http.createServer(async (req, res) => {
	try {
		// GET / — health check
		if (req.method === 'GET' && req.url?.startsWith('/')) {
			const path = new URL(req.url, `http://localhost:${PORT}`).pathname;
			if (path === '/') {
				return json(res, 200, { status: 'ok', ...sem.stats });
			}
		}

		// POST /convert?format=pdf
		if (req.method === 'POST' && req.url?.startsWith('/convert')) {
			// Auth
			if (ACCESS_KEY && req.headers.authorization !== ACCESS_KEY) {
				return json(res, 401, { error: 'Unauthorized' });
			}

			const url = new URL(req.url, `http://localhost:${PORT}`);
			const format = url.searchParams.get('format');
			if (format !== 'pdf') {
				return json(res, 400, {
					error: 'Missing or unsupported query parameter: format',
				});
			}

			const html = await readBody(req, BODY_LIMIT);
			if (!html) {
				return json(res, 400, { error: 'Request body must be HTML text' });
			}

			const id = Date.now();
			console.log(
				`[pubstash] convert start id=${id} bytes=${html.length} sem=${JSON.stringify(sem.stats)}`,
			);
			const start = performance.now();

			await sem.acquire();
			try {
				const pdfBuffer = await convertHtmlToPdf(html);
				const pdfUrl = await uploadPdfToS3(pdfBuffer);
				const duration = ((performance.now() - start) / 1000).toFixed(2);
				console.log(
					`[pubstash] convert done  id=${id} duration=${duration}s size=${pdfBuffer.length}`,
				);
				return json(res, 200, { url: pdfUrl });
			} finally {
				sem.release();
			}
		}

		return json(res, 404, { error: 'Not found' });
	} catch (err: any) {
		console.error(`[pubstash] error: ${err.message}`);
		return json(res, 500, { error: err.message ?? 'Internal server error' });
	}
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function main() {
	browser = await launchBrowser();
	console.log(`[pubstash] chromium launched (version ${browser.version()})`);

	httpServer.listen(PORT, () => {
		console.log(`[pubstash] listening on 0.0.0.0:${PORT}  max_concurrency=${MAX_CONCURRENCY}`);
	});

	// Graceful shutdown
	const shutdown = async () => {
		console.log('[pubstash] shutting down…');
		httpServer.close();
		await browser.close();
		process.exit(0);
	};
	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
}

main().catch((err) => {
	console.error('[pubstash] fatal:', err);
	process.exit(1);
});
