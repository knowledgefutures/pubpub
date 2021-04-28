import React from 'react';
import TimeAgo from 'react-timeago';

import { ScopeSummary, Collection, Pub } from 'utils/types';
import { capitalize } from 'utils/strings';
import { getSchemaForKind } from 'utils/collections/schemas';
import { formatDate, timeAgoBaseProps } from 'utils/dates';
import { getPubPublishedDate } from 'utils/pub/pubDates';

import { IconLabelPair } from './OverviewRowSkeleton';

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
	return <TimeAgo {...timeAgoBaseProps} live={false} date={date} />;
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
