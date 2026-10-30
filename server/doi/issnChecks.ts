import { getCrossrefJournal } from './crossrefChecks';

export type IssnType = 'electronic' | 'print';

export const formatIssn = (issn: string) => `${issn.slice(0, 4)}-${issn.slice(4)}`;

// Crossref matches the deposited title against its title record exactly, so only whitespace is
// forgiven here.
export const sameTitle = (a?: string | null, b?: string | null) =>
	(a ?? '').replace(/\s+/g, ' ').trim() === (b ?? '').replace(/\s+/g, ' ').trim();

export type DepositTitle = { title: string; usedFor: string };

/**
 * The journal titles a community's Crossref deposits send: pubs in an issue use the Journal
 * Citation (citeAs) if there is one, and every other pub uses the community title.
 */
export const getDepositTitles = (community: {
	title: string;
	citeAs?: string | null;
}): DepositTitle[] => {
	const forIssues = community.citeAs?.trim() || community.title;
	return forIssues === community.title
		? [{ title: community.title, usedFor: 'all pubs' }]
		: [
				{ title: forIssues, usedFor: 'pubs in issues (the Journal Citation)' },
				{ title: community.title, usedFor: 'pubs not in an issue (the community title)' },
			];
};

export type IssnCheck = {
	/** Whether Crossref has a journal under this ISSN. Null when it couldn't be checked. */
	found: boolean | null;
	crossrefTitle?: string;
	/** The type Crossref has this ISSN registered as, if it has it. */
	crossrefType?: string;
	titleMatches?: boolean;
	/** The deposited titles that differ from Crossref's. */
	mismatchedTitles?: DepositTitle[];
	/** Set when the lookup itself failed. */
	error?: string;
	/** Everything worth telling a person, in words. */
	problems: string[];
};

/**
 * Compare a (normalized) ISSN with Crossref's journal record: does it exist, is it registered under
 * every title the deposits send, and as the same type (electronic or print)? Crossref rejects a
 * deposit whose ISSN is registered under a different title.
 */
export const checkIssnWithCrossref = async (
	issn: string,
	type: IssnType,
	depositTitles: DepositTitle[],
): Promise<IssnCheck> => {
	const label = `${type} ISSN ${formatIssn(issn)}`;
	const journal = await getCrossrefJournal(issn);
	if (journal.state === 'unavailable') {
		return { found: null, problems: [] };
	}
	if (journal.state === 'error') {
		return {
			found: null,
			error: journal.message,
			problems: [`Couldn't check ${label} with Crossref: ${journal.message}`],
		};
	}
	if (journal.state === 'not_found') {
		return {
			found: false,
			problems: [
				`Crossref has no journal registered under ${label} yet, so it can't be checked. The first deposit that sends it registers it to this journal, so make sure it's right.`,
			],
		};
	}
	const problems: string[] = [];
	const mismatched = depositTitles.filter(({ title }) => !sameTitle(title, journal.title));
	mismatched.forEach(({ title, usedFor }) => {
		problems.push(
			`Crossref has ${label} registered to "${journal.title}", but deposits for ${usedFor} send "${title}". Crossref rejects those.`,
		);
	});
	const titleMatches = mismatched.length === 0;
	const registered = journal.issns.find((entry) => entry.value.replace('-', '') === issn);
	if (registered && registered.type !== type) {
		problems.push(
			`Crossref lists ${formatIssn(issn)} as the ${registered.type} ISSN, not ${type}.`,
		);
	}
	return {
		found: true,
		crossrefTitle: journal.title,
		crossrefType: registered?.type,
		titleMatches,
		mismatchedTitles: mismatched,
		problems,
	};
};
