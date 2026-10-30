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

const checkIssn = async (
	issn: string,
	_type: string,
	titles: { title: string; usedFor: string }[],
): Promise<IssnCheck> => {
	const record = crossref[issn];
	if (!record) return { found: false, problems: [] };
	const mismatchedTitles = titles.filter(({ title }) => title !== record.title);
	return {
		found: true,
		crossrefTitle: record.title,
		crossrefType: record.type,
		titleMatches: !mismatchedTitles.length,
		mismatchedTitles,
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
		'Crossref has 1234-5679 registered to "Some Other Journal", but deposits for all pubs send "Harvard Data Science Review", which Crossref would reject. Make them match exactly, or ask Crossref to change its title.',
		"Issues use 2 different electronic ISSNs: 2644-2353, 1234-5679. If this community publishes more than one journal, leave its ISSNs empty and give each journal's issues their own ISSNs and Journal title.",
		'Crossref registers these ISSNs to different journals: Harvard Data Science Review; Some Other Journal.',
	]);
});

it("marks an ISSN Crossref doesn't know yet as unverified", async () => {
	const proposal = await proposeCommunityIssns(
		hdsr,
		[{ slug: 'a', electronicIssn: 'ISSN 2637–6091 (online)' }],
		checkIssn,
	);
	expect(proposal).toMatchObject({
		status: 'unverified',
		electronicIssn: '26376091',
		problems: [],
		issueFixes: [
			"Not in Crossref yet, so unchecked: 2637-6091. Confirm it's this journal's ISSN before applying.",
		],
	});
});

it('checks the Journal Citation that pubs in issues send, as well as the community title', async () => {
	const proposal = await proposeCommunityIssns(
		{ ...hdsr, citeAs: 'HDSR' },
		[{ slug: 'a', electronicIssn: '2644-2353' }],
		checkIssn,
	);
	expect(proposal.status).toEqual('needs review');
	expect(proposal.problems).toEqual([
		expect.stringContaining(
			'deposits for pubs in issues (the Journal Citation) send "HDSR", which Crossref would reject',
		),
	]);
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
