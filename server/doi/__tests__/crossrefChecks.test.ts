import { vi } from 'vitest';

import { env } from 'server/env';

import { fetchSubmissionResult, findMetadataPubPubDoesNotSend } from '../crossrefChecks';

const credentials = { login: 'role', password: 'secret' };

const respondWith = (body: string, status = 200) => {
	const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status }));
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
};

const completedLog = `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch_diagnostic status="completed" sp="cskAir.local">
	<submission_id>1234567</submission_id>
	<batch_id>1793365014307_eea8ec7d</batch_id>
	<record_diagnostic status="Success">
		<doi>10.1162/99608f92.f3abeae2</doi>
		<msg>Successfully updated</msg>
	</record_diagnostic>
	<record_diagnostic status="Failure">
		<doi>10.1162/99608f92</doi>
		<msg>ISSN 26442353 has been assigned to another title</msg>
	</record_diagnostic>
	<batch_data>
		<record_count>2</record_count>
		<success_count>1</success_count>
		<warning_count>0</warning_count>
		<failure_count>1</failure_count>
	</batch_data>
</doi_batch_diagnostic>`;

beforeEach(() => {
	env.DOI_SUBMISSION_URL = 'https://doi.crossref.org/servlet/deposit';
});

afterEach(() => {
	vi.unstubAllGlobals();
});

it('reads every DOI in a processed submission log', async () => {
	const fetchMock = respondWith(completedLog);
	const result = await fetchSubmissionResult('1793365014307_eea8ec7d.xml', credentials);
	expect(result).toEqual({
		state: 'completed',
		records: [
			{
				doi: '10.1162/99608f92.f3abeae2',
				status: 'Success',
				message: 'Successfully updated',
			},
			{
				doi: '10.1162/99608f92',
				status: 'Failure',
				message: 'ISSN 26442353 has been assigned to another title',
			},
		],
	});
	const url = new URL(fetchMock.mock.calls[0][0]);
	expect(url.origin + url.pathname).toEqual(
		'https://doi.crossref.org/servlet/submissionDownload',
	);
	expect(Object.fromEntries(url.searchParams)).toEqual({
		usr: 'role',
		pwd: 'secret',
		file_name: '1793365014307_eea8ec7d.xml',
		type: 'result',
	});
});

it('treats a queued or unknown submission as pending', async () => {
	respondWith('<doi_batch_diagnostic status="unknown_submission"></doi_batch_diagnostic>');
	expect(await fetchSubmissionResult('a.xml', credentials)).toEqual({ state: 'pending' });
	respondWith('<doi_batch_diagnostic status="in_process"></doi_batch_diagnostic>');
	expect(await fetchSubmissionResult('a.xml', credentials)).toEqual({ state: 'pending' });
});

it('reports a response that is not a submission log', async () => {
	respondWith('<html><body><h1>Login failed</h1></body></html>');
	expect(await fetchSubmissionResult('a.xml', credentials)).toEqual({
		state: 'error',
		message: 'Unexpected submission log response: Login failed',
	});
	respondWith('Server error', 500);
	expect(await fetchSubmissionResult('a.xml', credentials)).toEqual({
		state: 'error',
		message: 'Crossref returned 500 for the log',
	});
});

it('lists Crossref metadata that a redeposit would drop', () => {
	expect(findMetadataPubPubDoesNotSend({ 'reference-count': 0, title: ['x'] })).toEqual([]);
	expect(
		findMetadataPubPubDoesNotSend({
			'reference-count': 3,
			funder: [{ name: 'NSF' }],
			abstract: '<jats:p>…</jats:p>',
		}),
	).toEqual(['3 references', 'funding information', 'an abstract']);
});
