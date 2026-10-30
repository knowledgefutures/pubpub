import type { IssnCheck } from '../issnChecks';

import { proposeCommunityIssns } from '../issnBackfill';

const hdsr = {
	id: 'c1',
	subdomain: 'hdsr',
	title: 'Harvard Data Science Review',
	citeAs: null,
	electronicIssn: null,
	printIssn: null,
};

/** A stand-in for Crossref's journal records, by ISSN. */
const crossref: Record<string, { title: string; type: string } | null> = {
	'26442353': { title: 'Harvard Data Science Review', type: 'electronic' },
	'26888513': { title: 'Harvard Data Science Review', type: 'print' },
	'12345679': { title: 'Some Other Journal', type: 'electronic' },
	'26376091': null,
};

const checkIssn = async (issn: string): Promise<IssnCheck> => {
	const record = crossref[issn];
	if (!record) return { found: false, problems: [] };
	return {
		found: true,
		crossrefTitle: record.title,
		crossrefType: record.type,
		titleMatches: record.title === 'Harvard Data Science Review',
		problems: [],
	};
};

it("settles HDSR's ISSNs and lists the issues to correct", async () => {
	const proposal = await proposeCommunityIssns(
		hdsr,
		[
			{ slug: 'volume1issue1', electronicIssn: '2644-2353', printIssn: '2688-8513' },
			{ slug: 'volume5issue3', electronicIssn: '2644-2353', printIssn: '688-8513' },
			{ slug: 'volume5issue4', electronicIssn: '', printIssn: '2644-2353' },
			{ slug: 'volume6issue1', electronicIssn: '2644-2353' },
		],
		checkIssn,
	);
	expect(proposal).toEqual({
		communityId: 'c1',
		subdomain: 'hdsr',
		title: 'Harvard Data Science Review',
		status: 'ready',
		electronicIssn: '26442353',
		printIssn: '26888513',
		crossrefTitle: 'Harvard Data Science Review',
		problems: [],
		issueFixes: [
			`volume5issue3: print ISSN "688-8513" isn't a valid ISSN`,
			'volume5issue4: 2644-2353 is the electronic ISSN but is entered as print',
		],
	});
});

it("trusts Crossref's type when editors entered an ISSN in the wrong field everywhere", async () => {
	const proposal = await proposeCommunityIssns(
		hdsr,
		[{ slug: 'a', electronicIssn: '2688-8513', printIssn: '2644-2353' }],
		checkIssn,
	);
	expect(proposal).toMatchObject({
		status: 'ready',
		electronicIssn: '26442353',
		printIssn: '26888513',
	});
	expect(proposal.issueFixes).toHaveLength(2);
});

it('asks for review when issues disagree or Crossref has another journal', async () => {
	const proposal = await proposeCommunityIssns(
		hdsr,
		[
			{ slug: 'a', electronicIssn: '2644-2353' },
			{ slug: 'b', electronicIssn: '1234-5679' },
		],
		checkIssn,
	);
	expect(proposal.status).toEqual('needs review');
	expect(proposal.electronicIssn).toBeNull();
	expect(proposal.problems).toEqual([
		'Crossref has 1234-5679 registered to "Some Other Journal", not "Harvard Data Science Review".',
		'Issues use 2 different electronic ISSNs: 2644-2353, 1234-5679.',
		'Crossref registers these ISSNs to different journals: Harvard Data Science Review; Some Other Journal.',
	]);
});

it('asks for review when Crossref has no journal under the ISSN', async () => {
	const proposal = await proposeCommunityIssns(
		hdsr,
		[{ slug: 'a', electronicIssn: '2637–6091' }],
		checkIssn,
	);
	expect(proposal).toMatchObject({
		status: 'needs review',
		electronicIssn: '26376091',
		problems: [
			"Crossref has no journal registered under 2637-6091; check it's this journal's ISSN.",
		],
	});
});

it('leaves communities that already have ISSNs alone', async () => {
	const proposal = await proposeCommunityIssns(
		{ ...hdsr, electronicIssn: '2644-2353' },
		[{ slug: 'a', electronicIssn: '1234-5679' }],
		checkIssn,
	);
	expect(proposal.status).toEqual('already set');
});

it('reports when no issue has a valid ISSN', async () => {
	const proposal = await proposeCommunityIssns(
		hdsr,
		[{ slug: 'a', electronicIssn: 'xxxx-xxxx' }],
		checkIssn,
	);
	expect(proposal).toMatchObject({ status: 'nothing found', issueFixes: [expect.any(String)] });
});
