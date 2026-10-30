import cheerio from 'cheerio';

import { env } from 'server/env';

/**
 * Read-only lookups against Crossref, used to check a redeposit before and after it is sent.
 */

const politeQuery = 'mailto=dev@pubpub.org';
const requestTimeoutMs = 20_000;

export const isTestCrossref = () => {
	const submissionUrl = env.DOI_SUBMISSION_URL ?? '';
	return submissionUrl.includes('test') || submissionUrl.includes('sandbox');
};

export const getSubmissionHost = () => {
	try {
		return new URL(env.DOI_SUBMISSION_URL ?? '').host;
	} catch {
		return null;
	}
};

const fetchWithTimeout = (url: string) =>
	fetch(url, {
		headers: { 'user-agent': 'PubPub (mailto:dev@pubpub.org)' },
		signal: AbortSignal.timeout(requestTimeoutMs),
	});

export type CrossrefWorkLookup =
	| { state: 'found'; work: Record<string, any> }
	| { state: 'not_found' }
	| { state: 'unavailable' }
	| { state: 'error'; message: string };

/** The live Crossref record for a DOI. Not available against the test system. */
export const getCrossrefWork = async (doi: string): Promise<CrossrefWorkLookup> => {
	if (isTestCrossref()) {
		return { state: 'unavailable' };
	}
	try {
		const response = await fetchWithTimeout(
			`https://api.crossref.org/works/${doi}?${politeQuery}`,
		);
		if (response.status === 404) {
			return { state: 'not_found' };
		}
		if (!response.ok) {
			return { state: 'error', message: `Crossref API returned ${response.status}` };
		}
		const { message } = await response.json();
		return { state: 'found', work: message };
	} catch (err: any) {
		return { state: 'error', message: `Crossref API request failed: ${err?.message ?? err}` };
	}
};

/**
 * Metadata Crossref holds for a DOI that PubPub's deposits never include. A full redeposit
 * replaces the record, so any of these would be lost.
 */
export const findMetadataPubPubDoesNotSend = (work: Record<string, any>) => {
	const found: string[] = [];
	const referenceCount = work['references-count'] ?? work['reference-count'] ?? 0;
	if (referenceCount > 0) found.push(`${referenceCount} references`);
	if (work.license?.length) found.push('license information');
	if (work.funder?.length) found.push('funding information');
	if (work.abstract) found.push('an abstract');
	if (work['update-to']?.length) found.push('Crossmark updates');
	if (work['clinical-trial-number']?.length) found.push('clinical trial numbers');
	if (work.link?.length) found.push('full-text links');
	return found;
};

export type CrossrefJournalLookup =
	| { state: 'found'; title: string; issns: { value: string; type: string }[] }
	| { state: 'not_found' }
	| { state: 'unavailable' }
	| { state: 'error'; message: string };

/** The journal Crossref has registered under an ISSN. */
export const getCrossrefJournal = async (issn: string): Promise<CrossrefJournalLookup> => {
	if (isTestCrossref()) {
		return { state: 'unavailable' };
	}
	const formatted = `${issn.slice(0, 4)}-${issn.slice(4)}`;
	try {
		const response = await fetchWithTimeout(
			`https://api.crossref.org/journals/${formatted}?${politeQuery}`,
		);
		if (response.status === 404) {
			return { state: 'not_found' };
		}
		if (!response.ok) {
			return { state: 'error', message: `Crossref API returned ${response.status}` };
		}
		const { message } = await response.json();
		return { state: 'found', title: message.title, issns: message['issn-type'] ?? [] };
	} catch (err: any) {
		return { state: 'error', message: `Crossref API request failed: ${err?.message ?? err}` };
	}
};

export type SubmissionRecord = { doi: string; status: string; message: string };

export type SubmissionResult =
	| { state: 'pending' }
	| { state: 'completed'; records: SubmissionRecord[] }
	| { state: 'error'; message: string };

/**
 * Crossref processes deposits from a queue, so a successful upload only means the file was
 * received. The submission log, looked up by file name, has the real per-DOI result.
 */
export const fetchSubmissionResult = async (
	filename: string,
	credentials: { login: string; password: string },
): Promise<SubmissionResult> => {
	const submissionUrl = env.DOI_SUBMISSION_URL;
	if (!submissionUrl) {
		return { state: 'error', message: 'DOI_SUBMISSION_URL is not set' };
	}
	const url = new URL('/servlet/submissionDownload', submissionUrl);
	url.search = new URLSearchParams({
		usr: credentials.login,
		pwd: credentials.password,
		file_name: filename,
		type: 'result',
	}).toString();

	let body: string;
	try {
		const response = await fetchWithTimeout(url.toString());
		body = await response.text();
		if (!response.ok) {
			return { state: 'error', message: `Crossref returned ${response.status} for the log` };
		}
	} catch (err: any) {
		return {
			state: 'error',
			message: `Couldn't fetch the submission log: ${err?.message ?? err}`,
		};
	}

	const $ = cheerio.load(body, { xmlMode: true });
	const diagnostic = $('doi_batch_diagnostic').first();
	if (!diagnostic.length) {
		const text = body
			.replace(/<[^>]*>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		return {
			state: 'error',
			message: `Unexpected submission log response: ${text.slice(0, 200)}`,
		};
	}
	// Anything but "completed" (queued, in_process, or not yet known) means try again later.
	if (diagnostic.attr('status') !== 'completed') {
		return { state: 'pending' };
	}
	const records = diagnostic
		.find('record_diagnostic')
		.toArray()
		.map((el) => ({
			doi: $(el).find('doi').first().text().trim(),
			status: ($(el).attr('status') ?? '').trim(),
			message: $(el).find('msg').first().text().trim(),
		}));
	return { state: 'completed', records };
};
