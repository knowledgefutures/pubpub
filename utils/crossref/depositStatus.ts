/**
 * Deposit state as Doily reports it, and the one rule that decides how a DOI is
 * allowed to be displayed.
 *
 * PubPub used to treat "we POSTed a deposit and did not get a 4xx" as
 * registration. Doily now pushes the registrar's actual verdict (see
 * server/doily/webhook.ts), so a deposit record carries a status.
 *
 * The load-bearing case is the absent one. Every DOI deposited before this
 * feature existed has a NULL status, and every DOI that was assigned but never
 * deposited has no deposit record at all. Both must keep rendering exactly as
 * they do today: if `legacy` were treated as "not confirmed", every genuinely
 * registered DOI in the archive would vanish from pub pages, citations and the
 * Google Scholar meta tags in one deploy. An unrecognized status (a state Doily
 * adds after this build ships) falls into `legacy` for the same reason: a DOI is
 * never hidden because we failed to recognize a word.
 */

export const depositStatuses = [
	'draft',
	'submitted',
	'queued',
	'registered',
	'unverified',
	'failed',
] as const;

export type DepositStatus = (typeof depositStatuses)[number];

export const isDepositStatus = (value: unknown): value is DepositStatus =>
	typeof value === 'string' && (depositStatuses as readonly string[]).includes(value);

/**
 * How a DOI may be presented:
 *
 * - `legacy`      no status recorded (pre-feature row, undeposited DOI, or an
 *                 unknown status). Render exactly as PubPub always has.
 * - `registered`  the registrar confirmed it. Safe to call final.
 * - `unverified`  deposited, but Doily could not confirm the record at the
 *                 registrar. Visible, with a caveat where there is room for one,
 *                 never hidden: the DOI usually does resolve.
 * - `pending`     draft / submitted / queued. In flight, so it may not resolve
 *                 yet. Not published as an identifier.
 * - `failed`      the registrar rejected it. Not published as an identifier, and
 *                 the dashboard needs to say so out loud.
 */
export type DoiDisplay = 'legacy' | 'registered' | 'unverified' | 'pending' | 'failed';

export const getDoiDisplay = (status?: string | null): DoiDisplay => {
	switch (status) {
		case 'registered':
			return 'registered';
		case 'unverified':
			return 'unverified';
		case 'draft':
		case 'submitted':
		case 'queued':
			return 'pending';
		case 'failed':
			return 'failed';
		default:
			return 'legacy';
	}
};

/**
 * May this DOI be published as the work's identifier: citation_doi and friends,
 * the citation strings, a doi.org link we ask a reader to click? Only states
 * where the DOI plausibly resolves qualify. A pending or failed deposit means
 * doi.org answers 404, and a 404 in a Google Scholar record is worse than no
 * record at all.
 */
export const isDoiPublic = (status?: string | null, everRegistered = false): boolean => {
	// A DOI that has EVER registered stays live at the registrar even when the
	// most recent attempt failed, because deposit state is per attempt: rejecting
	// an *update* to an already-registered record leaves the record, and doi.org
	// keeps resolving it. Hiding it would pull a working identifier out of pub
	// pages, citation strings and Scholar records over stale metadata, which is
	// strictly the worse failure. Doily reports this as firstRegisteredAt on the
	// deposit summary it sends with every webhook.
	if (everRegistered) {
		return true;
	}
	const display = getDoiDisplay(status);
	return display === 'legacy' || display === 'registered' || display === 'unverified';
};

/** Is the registrar still to have its say? Drives "pending" affordances. */
export const isDoiPending = (status?: string | null): boolean =>
	getDoiDisplay(status) === 'pending';

/** Did the registrar reject the record? Drives the retry affordance. */
export const isDoiFailed = (status?: string | null): boolean => getDoiDisplay(status) === 'failed';
