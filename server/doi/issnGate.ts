import { type CrossrefJournalLookup, getCrossrefJournal, isTestCrossref } from './crossrefChecks';
import { formatIssn, sameTitle } from './issnChecks';

/**
 * Crossref rejects a deposit whose ISSN is registered under a different journal title. Before a
 * deposit is built for sending, each ISSN in it is checked against Crossref's journal records, and
 * any that would cause a rejection is left out, with a note saying why. A messy ISSN can then only
 * mean an ISSN isn't sent yet, never a failed deposit.
 */

const cacheTtlMs = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; lookup: Promise<CrossrefJournalLookup> }>();

const lookUpJournal = (issn: string) => {
	const cached = cache.get(issn);
	if (cached && Date.now() - cached.at < cacheTtlMs) {
		return cached.lookup;
	}
	const lookup = getCrossrefJournal(issn).then((result) => {
		// Don't remember failures; the next deposit tries again.
		if (result.state === 'error') cache.delete(issn);
		return result;
	});
	cache.set(issn, { at: Date.now(), lookup });
	return lookup;
};

export const clearIssnGateCache = () => cache.clear();

type IssnEntry = { '@media_type': string; '#text': string };

export const vetDepositIssns = async <T extends { deposit: any; issnNotes?: string[] }>(
	depositJson: T,
): Promise<T> => {
	const metadata = depositJson?.deposit?.doi_batch?.body?.journal?.journal_metadata;
	const entries: IssnEntry[] = metadata?.issn ?? [];
	if (!entries.length || isTestCrossref()) {
		return depositJson;
	}
	const title: string = metadata.full_title;
	const notes: string[] = [];
	const kept: IssnEntry[] = [];
	for (const entry of entries) {
		const issn = entry['#text'];
		const label = `${entry['@media_type']} ISSN ${formatIssn(issn)}`;
		// biome-ignore lint/performance/noAwaitInLoops: at most two, and usually cached
		const journal = await lookUpJournal(issn);
		if (journal.state === 'found' && !sameTitle(journal.title, title)) {
			notes.push(
				`Left out the ${label}: Crossref has it registered to "${journal.title}", but this deposit's journal title is "${title}", so Crossref would reject the deposit. Make the titles match to include it.`,
			);
		} else if (journal.state === 'error') {
			notes.push(
				`Left out the ${label}: couldn't check it with Crossref (${journal.message}). It will be included once it can be checked.`,
			);
		} else if (journal.state === 'found') {
			// Editors often enter an ISSN in the wrong field; Crossref's record says which it is.
			const registered = journal.issns.find((item) => item.value.replace('-', '') === issn);
			if (registered && registered.type !== entry['@media_type']) {
				notes.push(
					`Sent ISSN ${formatIssn(issn)} as ${registered.type}, as Crossref has it registered, rather than ${entry['@media_type']}.`,
				);
				kept.push({ ...entry, '@media_type': registered.type });
			} else {
				kept.push(entry);
			}
		} else {
			// Not in Crossref yet; this deposit registers it.
			kept.push(entry);
		}
	}
	if (kept.length) {
		metadata.issn = kept;
	} else {
		delete metadata.issn;
	}
	if (notes.length) {
		depositJson.issnNotes = notes;
	}
	return depositJson;
};
