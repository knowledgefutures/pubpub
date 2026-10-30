import { getCrossrefJournal } from './crossrefChecks';

export type IssnType = 'electronic' | 'print';

export const formatIssn = (issn: string) => `${issn.slice(0, 4)}-${issn.slice(4)}`;

export const normalizeTitle = (title?: string | null) =>
	(title ?? '')
		.toLowerCase()
		.replace(/^the\s+/, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

export type IssnCheck = {
	/** Whether Crossref has a journal under this ISSN. Null when it couldn't be checked. */
	found: boolean | null;
	crossrefTitle?: string;
	/** The type Crossref has this ISSN registered as, if it has it. */
	crossrefType?: string;
	titleMatches?: boolean;
	/** Set when the lookup itself failed. */
	error?: string;
	/** Everything worth telling a person, in words. */
	problems: string[];
};

/**
 * Compare a (normalized) ISSN with Crossref's journal record: does it exist, is it registered to
 * this journal's title, and as the same type (electronic or print)?
 */
export const checkIssnWithCrossref = async (
	issn: string,
	type: IssnType,
	journalTitle: string,
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
				`Crossref has no journal registered under ${label}. Deposits will create one; check the ISSN is right.`,
			],
		};
	}
	const problems: string[] = [];
	const titleMatches = normalizeTitle(journal.title) === normalizeTitle(journalTitle);
	if (!titleMatches) {
		problems.push(
			`Crossref has ${label} registered to "${journal.title}", but deposits send the title "${journalTitle}". Crossref may reject them.`,
		);
	}
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
		problems,
	};
};
