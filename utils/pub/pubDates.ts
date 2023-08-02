import { formatDate, getLocalDateMatchingUtcCalendarDate } from 'utils/dates';

import * as types from 'types';
import { Pub } from 'server/models';

export const getPubLatestReleasedDate = (pub: types.Pub | Pub) => {
	if (!pub.releases || pub.releases?.length === 0) {
		return null;
	}
	return pub.releases
		.map((release) => new Date(release.createdAt))
		.reduce((latestDate, date) => {
			return date > latestDate ? date : latestDate;
		});
};

export const getPubCreatedDate = (pub: types.Pub | Pub) => {
	return pub.createdAt;
};

export const getPubPublishedDate = (pub: types.Pub | Pub, includeCustomPublishedAt = true) => {
	if (pub.customPublishedAt && includeCustomPublishedAt) {
		return getLocalDateMatchingUtcCalendarDate(pub.customPublishedAt);
	}
	const { releases } = pub;
	if (releases && releases.length > 0) {
		const [firstRelease] = releases;
		return new Date(firstRelease.createdAt);
	}
	return null;
};

export const getPubPublishedDateString = (pub: types.Pub): string | null => {
	const publishedDate = getPubPublishedDate(pub, true);
	let publishedDateString = '';
	if (publishedDate) publishedDateString = formatDate(publishedDate);
	if (publishedDate && pub.releases?.length === 0) publishedDateString += ' (Not yet released)';
	return publishedDateString || null;
};

export const getPubLatestReleaseDate = (pub: types.Pub, { excludeFirstRelease = false } = {}) => {
	const { releases } = pub;
	if (!releases) {
		return null;
	}
	if (releases.length === 1 && excludeFirstRelease) {
		return null;
	}
	const latestRelease = releases[releases.length - 1];
	if (latestRelease) {
		return new Date(latestRelease.createdAt);
	}
	return null;
};

export const getPubUpdatedDate = ({
	pub,
	historyData = null,
}: {
	pub: types.Pub | Pub;
	historyData?: types.Maybe<{ timestamps?: number[]; latestKey?: number }>;
}) => {
	if (historyData) {
		const { timestamps, latestKey } = historyData;
		if (timestamps && typeof latestKey === 'number') {
			const latestTimestamp = timestamps[latestKey];
			return new Date(latestTimestamp);
		}
	}
	if ('draft' in pub && pub.draft?.latestKeyAt) {
		return pub.draft.latestKeyAt;
	}
	return null;
};
