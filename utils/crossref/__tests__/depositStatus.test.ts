import { describe, expect, it } from 'vitest';

import { depositStatuses, getDoiDisplay, isDepositStatus, isDoiPublic } from '../depositStatus';

// The whole point of these cases is the absent status. PubPub has thousands of
// DOIs that were deposited before any outcome was recorded, and if a NULL status
// ever renders as "not registered" they all disappear from pub pages, citations
// and the Google Scholar meta tags at once.

describe('getDoiDisplay', () => {
	it('treats no recorded status as legacy, which renders as it always did', () => {
		expect(getDoiDisplay(null)).toBe('legacy');
		expect(getDoiDisplay(undefined)).toBe('legacy');
		expect(getDoiDisplay('')).toBe('legacy');
	});

	it('treats a status this build does not know as legacy, never as hidden', () => {
		// Doily can add a status after this build ships. A DOI must never vanish
		// because we failed to recognize a word.
		expect(getDoiDisplay('withdrawn')).toBe('legacy');
	});

	it('maps every status Doily can send', () => {
		expect(getDoiDisplay('registered')).toBe('registered');
		expect(getDoiDisplay('unverified')).toBe('unverified');
		expect(getDoiDisplay('draft')).toBe('pending');
		expect(getDoiDisplay('submitted')).toBe('pending');
		expect(getDoiDisplay('queued')).toBe('pending');
		expect(getDoiDisplay('failed')).toBe('failed');
	});
});

describe('isDoiPublic', () => {
	it('publishes legacy, registered and unverified DOIs', () => {
		expect(isDoiPublic(null)).toBe(true);
		expect(isDoiPublic('registered')).toBe(true);
		// Unverified is visible on purpose: the DOI usually does resolve, and
		// hiding it would be the same regression as hiding a legacy one.
		expect(isDoiPublic('unverified')).toBe(true);
	});

	it('withholds a DOI that is in flight or was rejected', () => {
		expect(isDoiPublic('draft')).toBe(false);
		expect(isDoiPublic('submitted')).toBe(false);
		expect(isDoiPublic('queued')).toBe(false);
		expect(isDoiPublic('failed')).toBe(false);
	});

	it('keeps publishing a DOI that ever registered, whatever the last attempt did', () => {
		// The case this exists for: re-depositing an already-registered record and
		// having the registrar reject the UPDATE. Doily reports status 'failed'
		// because deposit state is per attempt, but doi.org still resolves the DOI.
		// Hiding it would pull a working identifier out of pub pages, citations and
		// the Scholar meta tags over stale metadata.
		expect(isDoiPublic('failed', true)).toBe(true);
		expect(isDoiPublic('queued', true)).toBe(true);
		expect(isDoiPublic('submitted', true)).toBe(true);
		// And the flag never makes a never-registered DOI publishable.
		expect(isDoiPublic('failed', false)).toBe(false);
		expect(isDoiPublic('draft', false)).toBe(false);
	});
});

describe('isDepositStatus', () => {
	it('accepts exactly the vocabulary Doily uses', () => {
		for (const status of depositStatuses) {
			expect(isDepositStatus(status)).toBe(true);
		}
	});

	it('rejects anything else, so an unknown word never reaches the column', () => {
		expect(isDepositStatus('Registered')).toBe(false);
		expect(isDepositStatus(null)).toBe(false);
		expect(isDepositStatus(undefined)).toBe(false);
		expect(isDepositStatus(42)).toBe(false);
	});
});
