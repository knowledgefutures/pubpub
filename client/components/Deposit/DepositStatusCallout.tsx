import React from 'react';

import { Callout } from '@blueprintjs/core';

import { getDoiDisplay } from 'utils/crossref/depositStatus';

type Props = {
	status?: string | null;
	/** Registrar (or Doily) failure text for the last attempt, shown verbatim. */
	error?: string | null;
	lastCheckedAt?: string | Date | null;
	registrarName?: string;
};

const formatCheckedAt = (lastCheckedAt?: string | Date | null) => {
	if (!lastCheckedAt) {
		return null;
	}
	const date = new Date(lastCheckedAt);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date.toLocaleString();
};

/**
 * What the registrar actually said about a deposit, for the manage-level DOI UI.
 *
 * Before Doily pushed outcomes, PubPub could only say "deposited", which meant
 * "we POSTed it and were not told no". So the two states worth an affordance
 * (still in flight, and rejected) had no way to appear at all. Renders nothing
 * for a legacy row: a deposit with no recorded state is the pre-Doily normal and
 * must look exactly as it always did rather than sprouting a scary callout.
 */
export default function DepositStatusCallout(props: Props) {
	const { status, error, lastCheckedAt, registrarName = 'Crossref' } = props;
	const display = getDoiDisplay(status);
	const checkedAt = formatCheckedAt(lastCheckedAt);
	const checkedAtLine = checkedAt ? (
		<p className="deposit-status-checked">As of {checkedAt}.</p>
	) : null;

	if (display === 'legacy') {
		return null;
	}

	if (display === 'registered') {
		return (
			<Callout intent="success" icon="tick" title={`Registered with ${registrarName}`}>
				<p>The DOI is registered and resolves to this Pub.</p>
				{checkedAtLine}
			</Callout>
		);
	}

	if (display === 'unverified') {
		return (
			<Callout intent="warning" title="Registration not confirmed">
				<p>
					This deposit was submitted and {registrarName} did not report a failure, but the
					registration could not be confirmed. The DOI is displayed as normal. If it does
					not resolve, submit the deposit again.
				</p>
				{error && <p>{error}</p>}
				{checkedAtLine}
			</Callout>
		);
	}

	if (display === 'pending') {
		return (
			<Callout intent="primary" icon="time" title="Registration in progress">
				<p>
					The deposit is with {registrarName}, which usually rules on it within a few
					hours. Until it confirms, this DOI is left out of the Pub page, the citations
					and the metadata search engines read, so that nobody is sent to a link that does
					not resolve yet. Nothing more to do here: reload this page to see the outcome.
				</p>
				{checkedAtLine}
			</Callout>
		);
	}

	return (
		<Callout intent="danger" icon="error" title={`${registrarName} rejected this deposit`}>
			<p>
				The DOI is not registered, so it is left out of the Pub page, the citations and the
				metadata search engines read. Correct what the message below points at, then submit
				the deposit again.
			</p>
			{error && <p className="deposit-status-error">{error}</p>}
			{checkedAtLine}
		</Callout>
	);
}
