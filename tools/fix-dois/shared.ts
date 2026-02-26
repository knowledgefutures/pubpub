import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

// crossref polite pool: 3 concurrent, 10/s total with mailto
const CROSSREF_CONCURRENCY = 3;
const CROSSREF_BATCH_DELAY_MS = 350;
const CROSSREF_BACKOFF_MS = 10_000;

// doi.org handle api is more lenient but still be polite
const DOI_CONCURRENCY = 5;
const DOI_BATCH_DELAY_MS = 200;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createLogger(prefix: string) {
	return {
		log: (msg: string) => console.log(`[${prefix}] ${msg}`),
		warn: (msg: string) => console.warn(`[${prefix}] WARN: ${msg}`),
		error: (msg: string) => console.error(`[${prefix}] ERROR: ${msg}`),
	};
}

export function getArgValue(flag: string): string | null {
	const idx = process.argv.indexOf(flag);
	if (idx !== -1 && process.argv[idx + 1]) {
		return process.argv[idx + 1];
	}
	return null;
}

export function getInputPath(defaultFile = 'real-failurs.json'): string {
	const val = getArgValue('--input');
	if (val) {
		return path.resolve(val);
	}
	return path.resolve(__dirname, defaultFile);
}

export function getRange(): [number, number] | null {
	const val = getArgValue('--range');
	if (!val) {
		return null;
	}
	const parts = val.split('-').map(Number);
	if (parts.length === 2 && parts[0] >= 0 && parts[1] > parts[0]) {
		return [parts[0], parts[1]];
	}
	return null;
}

export function applyRange<T>(items: T[]): T[] {
	const range = getRange();
	if (!range) {
		return items;
	}
	return items.slice(range[0], range[1]);
}

export function writeResults(name: string, data: unknown): string {
	const outputPath = path.resolve(__dirname, `${name}-${Date.now()}.json`);
	fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
	return outputPath;
}

export type CheckResult = { ok: boolean; error?: string };

// checks whether a doi resolves via the handle system (doi.org).
// this is faster than crossref api and reflects registration status
// more quickly after a deposit.
async function singleDoiResolveCheck(doi: string): Promise<CheckResult> {
	try {
		const response = await fetch(`https://doi.org/api/handles/${doi}`);
		if (!response.ok) {
			return { ok: false, error: `HTTP ${response.status}` };
		}
		const data = (await response.json()) as { responseCode: number };
		// responseCode 1 = success, 100 = handle not found
		return data.responseCode === 1
			? { ok: true }
			: { ok: false, error: `handle responseCode ${data.responseCode}` };
	} catch (e: any) {
		return { ok: false, error: e.message };
	}
}

async function singleCrossrefCheck(doi: string): Promise<CheckResult> {
	try {
		const response = await fetch(`https://api.crossref.org/works/${doi}?mailto=dev@pubpub.org`);
		if (response.status === 429) {
			await sleep(CROSSREF_BACKOFF_MS);
			const retry = await fetch(
				`https://api.crossref.org/works/${doi}?mailto=dev@pubpub.org`,
			);
			return retry.ok ? { ok: true } : { ok: false, error: `HTTP ${retry.status}` };
		}
		return response.ok ? { ok: true } : { ok: false, error: `HTTP ${response.status}` };
	} catch (e: any) {
		return { ok: false, error: e.message };
	}
}

export async function checkDoiInCrossref(doi: string): Promise<boolean> {
	const result = await singleCrossrefCheck(doi);
	return result.ok;
}

export async function checkDoiResolves(doi: string): Promise<boolean> {
	const result = await singleDoiResolveCheck(doi);
	return result.ok;
}

// polls doi.org until the doi resolves or we hit the timeout
export async function waitForDoiResolution(
	doi: string,
	{
		timeoutMs = 60_000,
		intervalMs = 5_000,
		logger,
	}: {
		timeoutMs?: number;
		intervalMs?: number;
		logger?: ReturnType<typeof createLogger>;
	} = {},
): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		// biome-ignore lint/performance/noAwaitInLoops: polling loop, inherently sequential
		const resolves = await checkDoiResolves(doi);
		if (resolves) {
			return true;
		}
		logger?.log(
			`  waiting for ${doi} to resolve (${Math.round((Date.now() - start) / 1000)}s elapsed)...`,
		);
		await sleep(intervalMs);
	}
	return false;
}

async function batchCheck<T>(
	items: T[],
	getDoi: (item: T) => string | null,
	checkFn: (doi: string) => Promise<CheckResult>,
	concurrency: number,
	batchDelay: number,
	onBatchDone?: (checked: number, total: number) => void,
): Promise<Map<T, CheckResult>> {
	const results = new Map<T, CheckResult>();
	const withDois = items.filter((item) => getDoi(item) !== null);

	for (let i = 0; i < withDois.length; i += concurrency) {
		const batch = withDois.slice(i, i + concurrency);
		// biome-ignore lint/performance/noAwaitInLoops: intentional rate-limited batching
		const batchResults = await Promise.all(
			batch.map(async (item) => ({
				item,
				result: await checkFn(getDoi(item)!),
			})),
		);
		for (const { item, result } of batchResults) {
			results.set(item, result);
		}
		onBatchDone?.(Math.min(i + concurrency, withDois.length), withDois.length);

		if (i + concurrency < withDois.length) {
			await sleep(batchDelay);
		}
	}

	for (const item of items) {
		if (!results.has(item)) {
			results.set(item, { ok: false, error: 'no DOI' });
		}
	}

	return results;
}

export async function checkDoisInCrossref<T>(
	items: T[],
	getDoi: (item: T) => string | null,
	onBatchDone?: (checked: number, total: number) => void,
): Promise<Map<T, CheckResult>> {
	return batchCheck(
		items,
		getDoi,
		singleCrossrefCheck,
		CROSSREF_CONCURRENCY,
		CROSSREF_BATCH_DELAY_MS,
		onBatchDone,
	);
}

export async function checkDoisResolve<T>(
	items: T[],
	getDoi: (item: T) => string | null,
	onBatchDone?: (checked: number, total: number) => void,
): Promise<Map<T, CheckResult>> {
	return batchCheck(
		items,
		getDoi,
		singleDoiResolveCheck,
		DOI_CONCURRENCY,
		DOI_BATCH_DELAY_MS,
		onBatchDone,
	);
}
