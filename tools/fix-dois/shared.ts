import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

// crossref polite pool: 3 concurrent, 10/s total with mailto
const CROSSREF_CONCURRENCY = 3;
const CROSSREF_BATCH_DELAY_MS = 350;
const CROSSREF_BACKOFF_MS = 10_000;

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

export type CrossrefCheckResult = { ok: boolean; error?: string };

async function singleDoiCheck(doi: string): Promise<CrossrefCheckResult> {
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
	const result = await singleDoiCheck(doi);
	return result.ok;
}

export async function checkDoisInCrossref<T>(
	items: T[],
	getDoi: (item: T) => string | null,
	onBatchDone?: (checked: number, total: number) => void,
): Promise<Map<T, CrossrefCheckResult>> {
	const results = new Map<T, CrossrefCheckResult>();
	const withDois = items.filter((item) => getDoi(item) !== null);

	for (let i = 0; i < withDois.length; i += CROSSREF_CONCURRENCY) {
		const batch = withDois.slice(i, i + CROSSREF_CONCURRENCY);
		// biome-ignore lint/performance/noAwaitInLoops: intentional rate-limited batching
		const batchResults = await Promise.all(
			batch.map(async (item) => ({
				item,
				result: await singleDoiCheck(getDoi(item)!),
			})),
		);
		for (const { item, result } of batchResults) {
			results.set(item, result);
		}
		onBatchDone?.(Math.min(i + CROSSREF_CONCURRENCY, withDois.length), withDois.length);

		if (i + CROSSREF_CONCURRENCY < withDois.length) {
			await sleep(CROSSREF_BATCH_DELAY_MS);
		}
	}

	for (const item of items) {
		if (!results.has(item)) {
			results.set(item, { ok: false, error: 'no DOI' });
		}
	}

	return results;
}
