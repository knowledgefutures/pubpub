import React from 'react';
import { Intent as BlueprintIntent } from '@blueprintjs/core';

import { ScopeSummary, Collection, Pub, SubmissionStatus } from 'types';
import { capitalize } from 'utils/strings';
import { getSchemaForKind } from 'utils/collections/schemas';
import { formatDate } from 'utils/dates';
import { getPubPublishedDate, getPubSubmissionDate } from 'utils/pub/pubDates';
import { TimeAgo, Icon, IconName } from 'components';

type IconLabelPair = {
	icon: IconName;
	label: string | React.ReactNode;
	iconSize?: number;
	intent?: BlueprintIntent;
};

export const getScopeSummaryLabels = (summary: ScopeSummary, showPubs = false) => {
	const { discussions, reviews, pubs } = summary;
	const labels: IconLabelPair[] = [];
	if (showPubs) {
		labels.push({
			label: String(pubs),
			icon: 'pubDoc' as const,
		});
	}
	if (discussions > 0) {
		labels.push({
			label: String(discussions),
			icon: 'chat' as const,
		});
	}
	if (reviews > 0) {
		labels.push({
			label: String(reviews),
			icon: 'social-media' as const,
		});
	}
	return labels;
};

export const getCollectionPublicStateLabel = (collection: Collection): IconLabelPair => {
	const { isPublic } = collection;
	if (isPublic) {
		return {
			label: 'Public',
			icon: 'globe' as const,
		};
	}
	return {
		label: 'Private',
		icon: 'lock' as const,
	};
};

export const getCollectionKindLabel = (collection: Collection): IconLabelPair => {
	const schema = getSchemaForKind(collection.kind)!;
	return {
		label: capitalize(schema.label.singular),
		icon: schema.bpDisplayIcon,
	};
};

const pageLoadTimeMs = Date.now();
const maxTimeagoPeriod = 1000 * 86400 * 7; // one week

const getDateLabelPart = (date: Date) => {
	if (pageLoadTimeMs - date.valueOf() > maxTimeagoPeriod) {
		return `on ${formatDate(date)}`;
	}
	return <TimeAgo date={date} />;
};

export const getPubReleasedStateLabel = (pub: Pub) => {
	const publishedDate = getPubPublishedDate(pub, false);
	if (publishedDate) {
		return {
			label: <>Published&nbsp;{getDateLabelPart(publishedDate)}</>,
			icon: 'globe' as const,
		};
	}
	return {
		label: 'Unreleased',
		icon: 'lock' as const,
	};
};

export const getSubmissionStatusLabel = (
	submissionStatus: Partial<SubmissionStatus>,
): IconLabelPair => {
	const iconSize = 16;
	if (submissionStatus === 'accepted') {
		return {
			label: 'Accepted',
			icon: 'symbol-square',
			intent: 'success',
			iconSize,
		};
	}
	if (submissionStatus === 'declined') {
		return {
			label: 'Declined',
			icon: 'symbol-square',
			intent: 'danger',
			iconSize,
		};
	}
	return {
		label: 'Pending',
		icon: 'symbol-square',
		intent: 'warning',
		iconSize,
	};
};

export const getSubmissionTimeLabel = (pub: Pub) => {
	const submissionDate = getPubSubmissionDate(pub);
	if (submissionDate) {
		return {
			label: (
				<>
					<em>Submitted</em>&nbsp;{getDateLabelPart(submissionDate)}
				</>
			),
			icon: 'time' as const,
		};
	}
	return {
		label: 'Update Status',
		icon: 'warning-sign' as const,
	};
};

export const renderLabelPairs = (iconLabelPairs: IconLabelPair[]) => {
	return (
		<div className="summary-icons">
			{iconLabelPairs.map((iconLabelPair, index) => {
				const {
					icon,
					label,
					iconSize: iconLabelPairIconSize = 12,
					intent = 'none',
				} = iconLabelPair;
				const iconElement =
					typeof icon === 'string' ? (
						<Icon icon={icon} iconSize={iconLabelPairIconSize} intent={intent} />
					) : (
						icon
					);
				return (
					<div
						className="summary-icon-pair"
						// eslint-disable-next-line react/no-array-index-key
						key={index}
					>
						{iconElement}
						{label}
					</div>
				);
			})}
		</div>
	);
};

export const renderRowDetails = (pub: Pub, hasSubmission: boolean): React.ReactNode => {
	if (pub.submission) {
		const { status } = pub.submission;
		const detailsRow = hasSubmission
			? renderLabelPairs([getSubmissionStatusLabel(status), getSubmissionTimeLabel(pub)])
			: renderLabelPairs([
					...getScopeSummaryLabels(pub.scopeSummary),
					getPubReleasedStateLabel(pub),
			  ]);
		return detailsRow;
	}

	return renderLabelPairs([
		...getScopeSummaryLabels(pub.scopeSummary),
		getPubReleasedStateLabel(pub),
	]);
};
