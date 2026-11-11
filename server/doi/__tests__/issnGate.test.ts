import { vi } from 'vitest';

import { env } from 'server/env';

import { clearIssnGateCache, vetDepositIssns } from '../issnGate';

const { getCrossrefJournal } = vi.hoisted(() => ({ getCrossrefJournal: vi.fn() }));

vi.mock('server/doi/crossrefChecks', async (importOriginal) => ({
	...(await importOriginal<object>()),
	getCrossrefJournal,
}));

const makeDeposit = (
	fullTitle: string,
	issns: [string, string][],
): { deposit: any; issnNotes?: string[] } => ({
	deposit: {
		doi_batch: {
			body: {
				journal: {
					journal_metadata: {
						full_title: fullTitle,
						issn: issns.map(([type, value]) => ({
							'@media_type': type,
							'#text': value,
						})),
						doi_data: { doi: '10.1162/99608f92' },
					},
				},
			},
		},
	},
});

const journals = {
	'26442353': {
		state: 'found',
		title: 'Harvard Data Science Review',
		issns: [{ value: '2644-2353', type: 'electronic' }],
	},
	'87564173': { state: 'found', title: 'Alki', issns: [{ value: '8756-4173', type: 'print' }] },
	'26376091': { state: 'not_found' },
	'12345679': { state: 'error', message: 'Crossref API returned 503' },
};

beforeEach(() => {
	env.DOI_SUBMISSION_URL = 'https://doi.crossref.org/servlet/deposit';
	clearIssnGateCache();
	getCrossrefJournal.mockImplementation(async (issn) => journals[issn]);
});

afterEach(() => {
	vi.clearAllMocks();
});

it('keeps an ISSN Crossref has under the same title', async () => {
	const json = await vetDepositIssns(
		makeDeposit('Harvard Data Science Review', [['electronic', '26442353']]),
	);
	expect(json.deposit.doi_batch.body.journal.journal_metadata.issn).toEqual([
		{ '@media_type': 'electronic', '#text': '26442353' },
	]);
	expect(json.issnNotes).toBeUndefined();
});

it('keeps an ISSN Crossref does not know yet, since the deposit registers it', async () => {
	const json = await vetDepositIssns(makeDeposit('New Journal', [['electronic', '26376091']]));
	expect(json.deposit.doi_batch.body.journal.journal_metadata.issn).toHaveLength(1);
});

it('corrects an ISSN entered as the wrong type', async () => {
	const json = await vetDepositIssns(
		makeDeposit('Harvard Data Science Review', [['print', '26442353']]),
	);
	expect(json.deposit.doi_batch.body.journal.journal_metadata.issn).toEqual([
		{ '@media_type': 'electronic', '#text': '26442353' },
	]);
	expect(json.issnNotes).toEqual([
		'Sent ISSN 2644-2353 as electronic, as Crossref has it registered, rather than print.',
	]);
});

it('leaves out an ISSN Crossref has under another title, and says why', async () => {
	const json = await vetDepositIssns(
		makeDeposit('Alki: The Washington Library Association Journal', [['print', '87564173']]),
	);
	const metadata = json.deposit.doi_batch.body.journal.journal_metadata;
	expect(metadata.issn).toBeUndefined();
	expect(Object.keys(metadata)).toEqual(['full_title', 'doi_data']);
	expect(json.issnNotes).toEqual([
		'Left out the print ISSN 8756-4173: Crossref has it registered to "Alki", but this deposit\'s journal title is "Alki: The Washington Library Association Journal", so Crossref would reject the deposit. Make the titles match to include it.',
	]);
});

it("leaves out an ISSN it couldn't check, and tries again next time", async () => {
	const deposit = () =>
		makeDeposit('Harvard Data Science Review', [
			['print', '12345679'],
			['electronic', '26442353'],
		]);
	const json = await vetDepositIssns(deposit());
	expect(json.deposit.doi_batch.body.journal.journal_metadata.issn).toEqual([
		{ '@media_type': 'electronic', '#text': '26442353' },
	]);
	expect(json.issnNotes).toEqual([expect.stringContaining('Crossref API returned 503')]);
	await vetDepositIssns(deposit());
	// The good ISSN is cached; the failed lookup is retried.
	expect(getCrossrefJournal.mock.calls.map(([issn]) => issn)).toEqual([
		'12345679',
		'26442353',
		'12345679',
	]);
});

it('leaves deposits alone against the test system', async () => {
	env.DOI_SUBMISSION_URL = 'https://test.crossref.org/servlet/deposit';
	const json = await vetDepositIssns(makeDeposit('Anything', [['print', '87564173']]));
	expect(json.deposit.doi_batch.body.journal.journal_metadata.issn).toHaveLength(1);
	expect(getCrossrefJournal).not.toHaveBeenCalled();
});
