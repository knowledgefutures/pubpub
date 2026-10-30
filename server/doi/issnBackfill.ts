import { renderJournalCitation } from 'utils/citations';
import normalizeIssn from 'utils/crossref/transform/issn';

import { checkIssnWithCrossref, formatIssn, type IssnCheck, type IssnType } from './issnChecks';

/**
 * Work out a community's electronic and print ISSNs from the ISSNs its editors entered on issues,
 * checking each against Crossref. Used to fill Communities.electronicIssn and printIssn once,
 * after they replaced the single, never-editable issn column.
 *
 * Crossref's journal record decides an ISSN's type when it has one, since issue fields are often
 * swapped. Anything ambiguous is reported for a person to resolve, never guessed.
 */

export type BackfillCommunity = {
	id: string;
	subdomain: string;
	title: string;
	citeAs: string | null;
	electronicIssn: string | null;
	printIssn: string | null;
};

export type BackfillIssue = {
	slug: string;
	electronicIssn?: string | null;
	printIssn?: string | null;
};

export type BackfillStatus =
	/** One clear ISSN per type, confirmed by Crossref. Safe to apply. */
	| 'ready'
	/** Something needs a person's judgement; see `problems`. */
	| 'needs review'
	/** The community already has ISSNs set; nothing is changed. */
	| 'already set'
	/** No valid ISSNs on any issue. */
	| 'nothing found';

export type BackfillProposal = {
	communityId: string;
	subdomain: string;
	title: string;
	status: BackfillStatus;
	electronicIssn: string | null;
	printIssn: string | null;
	crossrefTitle: string | null;
	/** Why this can't be applied automatically. */
	problems: string[];
	/** Issue metadata to correct; doesn't stop the community value being applied. */
	issueFixes: string[];
};

type CheckIssn = (issn: string, type: IssnType, journalTitle: string) => Promise<IssnCheck>;

const fields: { key: 'electronicIssn' | 'printIssn'; type: IssnType }[] = [
	{ key: 'electronicIssn', type: 'electronic' },
	{ key: 'printIssn', type: 'print' },
];

export const proposeCommunityIssns = async (
	community: BackfillCommunity,
	issues: BackfillIssue[],
	checkIssn: CheckIssn = checkIssnWithCrossref,
): Promise<BackfillProposal> => {
	const journalTitle = renderJournalCitation('', community.citeAs, community.title);
	const base = {
		communityId: community.id,
		subdomain: community.subdomain,
		title: community.title,
		crossrefTitle: null,
		problems: [] as string[],
		issueFixes: [] as string[],
	};

	if (community.electronicIssn || community.printIssn) {
		return {
			...base,
			status: 'already set',
			electronicIssn: community.electronicIssn,
			printIssn: community.printIssn,
		};
	}

	// Every valid ISSN entered on an issue, and which fields it was entered in.
	const candidates = new Map<string, { electronic: string[]; print: string[] }>();
	issues.forEach((issue) => {
		fields.forEach(({ key, type }) => {
			const raw = issue[key]?.trim();
			if (!raw) return;
			const issn = normalizeIssn(raw);
			if (!issn) {
				base.issueFixes.push(`${issue.slug}: ${type} ISSN "${raw}" isn't a valid ISSN`);
				return;
			}
			const entry = candidates.get(issn) ?? { electronic: [], print: [] };
			entry[type].push(issue.slug);
			candidates.set(issn, entry);
		});
	});

	if (!candidates.size) {
		return { ...base, status: 'nothing found', electronicIssn: null, printIssn: null };
	}

	// Decide each ISSN's type: Crossref's record if it has one, otherwise how editors entered it.
	const byType: Record<IssnType, string[]> = { electronic: [], print: [] };
	const crossrefTitles = new Set<string>();
	for (const [issn, entered] of candidates) {
		const enteredAs: IssnType =
			entered.electronic.length >= entered.print.length ? 'electronic' : 'print';
		// biome-ignore lint/performance/noAwaitInLoops: polite, sequential Crossref lookups
		const check = await checkIssn(issn, enteredAs, journalTitle);
		const type: IssnType =
			check.crossrefType === 'electronic' || check.crossrefType === 'print'
				? check.crossrefType
				: enteredAs;
		byType[type].push(issn);
		if (check.crossrefTitle) crossrefTitles.add(check.crossrefTitle);
		// A type mismatch is settled by trusting Crossref; these need a person.
		if (check.found === null) {
			base.problems.push(
				`Couldn't check ${formatIssn(issn)} with Crossref${check.error ? `: ${check.error}` : '.'}`,
			);
		} else if (check.found === false) {
			base.problems.push(
				`Crossref has no journal registered under ${formatIssn(issn)}; check it's this journal's ISSN.`,
			);
		} else if (!check.titleMatches) {
			base.problems.push(
				`Crossref has ${formatIssn(issn)} registered to "${check.crossrefTitle}", not "${journalTitle}".`,
			);
		}
		const misfiled = type === 'electronic' ? entered.print : entered.electronic;
		if (misfiled.length) {
			const otherType = type === 'electronic' ? 'print' : 'electronic';
			base.issueFixes.push(
				`${misfiled.join(', ')}: ${formatIssn(issn)} is the ${type} ISSN but is entered as ${otherType}`,
			);
		}
	}

	fields.forEach(({ type }) => {
		if (byType[type].length > 1) {
			base.problems.push(
				`Issues use ${byType[type].length} different ${type} ISSNs: ${byType[type].map(formatIssn).join(', ')}.`,
			);
		}
	});
	if (crossrefTitles.size > 1) {
		base.problems.push(
			`Crossref registers these ISSNs to different journals: ${[...crossrefTitles].join('; ')}.`,
		);
	}

	const pick = (type: IssnType) => (byType[type].length === 1 ? byType[type][0] : null);
	return {
		...base,
		crossrefTitle: crossrefTitles.size === 1 ? [...crossrefTitles][0] : null,
		status: base.problems.length ? 'needs review' : 'ready',
		electronicIssn: pick('electronic'),
		printIssn: pick('print'),
	};
};
