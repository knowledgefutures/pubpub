import dateFormat from 'dateformat';

import { getPrimaryCollection } from 'utils/collections/primary';
import { getLocalDateMatchingUtcCalendarDate } from 'utils/dates';
import { DefinitelyHas, Maybe, CollectionPub, Pub, Branch } from 'utils/types';

const selectBranch = (pub: DefinitelyHas<Pub, 'branches'>, branch: Maybe<Branch>) => {
	const { branches } = pub;
	if (!branch && !branches) {
		return null;
	}
	return branch || branches.find((br) => br.title === 'public');
};

export const getPubLatestReleasedDate = (pub: Pub) => {
	if (pub.releases.length === 0) {
		return null;
	}
	return pub.releases
		.map((release) => new Date(release.createdAt))
		.reduce((latestDate, date) => {
			return date > latestDate ? date : latestDate;
		});
};

export const getPubCreatedDate = (pub: Pub) => {
	return pub.createdAt;
};

export const getPubPublishedDate = (pub: Pub) => {
	if (pub.customPublishedAt) {
		// This is a date string representing a time at midnight UTC for a given date.
		// Unfortunately, that represents a time during the previous day in the Western hemisphere,
		// which will cause this to improperly render the previous day.
		return getLocalDateMatchingUtcCalendarDate(pub.customPublishedAt);
	}
	const { releases } = pub;
	if (releases.length > 0) {
		const [firstRelease] = releases;
		return new Date(firstRelease.createdAt);
	}
	return null;
};

export const getPubLatestReleaseDate = (pub: Pub, { excludeFirstRelease = false } = {}) => {
	const { releases } = pub;
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
	branch = null,
	historyData = null,
}: {
	pub: DefinitelyHas<Pub, 'branches'>;
	branch?: Maybe<Branch>;
	historyData?: Maybe<{ timestamps?: number[]; latestKey?: number }>;
}) => {
	if (historyData) {
		const { timestamps, latestKey } = historyData;
		if (timestamps && typeof latestKey === 'number') {
			const latestTimestamp = timestamps[latestKey];
			return new Date(latestTimestamp);
		}
	}
	const selectedBranch = selectBranch(pub, branch);
	if (selectedBranch) {
		if (selectedBranch.latestKeyAt) {
			return new Date(selectedBranch.latestKeyAt);
		}
	}
	return null;
};

export const getPubCopyrightYear = (
	pub: Pub & {
		collectionPubs: DefinitelyHas<CollectionPub, 'collection'>[];
	},
): string => {
	const primaryCollection = getPrimaryCollection(pub.collectionPubs);
	if (primaryCollection) {
		const { metadata } = primaryCollection;
		if (metadata) {
			const { copyrightYear, date, publicationDate } = metadata;
			const dateSource = copyrightYear || date || publicationDate;
			if (dateSource) {
				return dateFormat(dateSource, 'yyyy');
			}
		}
	}
	const pubPublishedDate = getPubPublishedDate(pub);
	// dateFormat defaults to today's date if its first argument is null
	return dateFormat(pubPublishedDate, 'yyyy');
};
