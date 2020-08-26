import React from 'react';
import { AnchorButton, Callout } from '@blueprintjs/core';

import { formatDate, datesAreSameCalendarDate } from 'utils/dates';
import { getPubLatestReleasedDate } from 'utils/pub/pubDates';
import { pubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';

require('./pubHistoricalNotice.scss');

type Props = {
	pubData: {
		releaseNumber?: number;
		isRelease?: boolean;
		releases: {
			createdAt?: string | any; // TODO: PropTypes.instanceOf(Date)
		}[];
	};
	historyData: {
		currentKey?: number;
		latestKey?: number;
		timestamps?: any;
		loadedIntoHistory?: boolean;
	};
};

const PubHistoricalNotice = (props: Props) => {
	const { pubData, historyData } = props;
	const { communityData } = usePageContext();
	const { releases, releaseNumber, isRelease } = pubData;
	const { currentKey, latestKey, timestamps, loadedIntoHistory } = historyData;

	const isHistoricalRelease = isRelease && releaseNumber !== releases.length;
	const isHistoricalDraft = loadedIntoHistory;

	if (!isHistoricalDraft && !isHistoricalRelease) {
		return null;
	}

	const renderWarning = () => {
		if (isRelease) {
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			const currentReleaseDate = new Date(releases[releaseNumber - 1].createdAt);
			const latestReleaseDate = getPubLatestReleasedDate(pubData);
			const includeTime = datesAreSameCalendarDate(currentReleaseDate, latestReleaseDate);
			return (
				<p>
					This version of the Pub was released{' '}
					{formatDate(currentReleaseDate, {
						includeTime: includeTime,
						includePreposition: true,
					})}
					. The latest version is from{' '}
					{formatDate(latestReleaseDate, { includeTime: includeTime })}.
				</p>
			);
		}
		// @ts-expect-error ts-migrate(2538) FIXME: Type 'undefined' cannot be used as an index type.
		const currentDate = new Date(timestamps[currentKey]);
		// @ts-expect-error ts-migrate(2538) FIXME: Type 'undefined' cannot be used as an index type.
		const latestDate = new Date(timestamps[latestKey]);
		const includeTime = datesAreSameCalendarDate(currentDate, latestDate);
		return (
			<p>
				You're viewing a draft of this Pub as it appeared{' '}
				{formatDate(currentDate, { includeTime: includeTime, includePreposition: true })}.
				It was most recently updated{' '}
				{formatDate(latestDate, {
					includeTime: includeTime,
					includePreposition: true,
				})}
				. See the latest draft to make changes and view comments.
			</p>
		);
	};

	const renderAction = () => {
		return (
			<AnchorButton href={pubUrl(communityData, pubData, { isDraft: !isRelease })}>
				{isRelease ? 'View the latest release' : 'See the latest draft'}
			</AnchorButton>
		);
	};

	return (
		<Callout
			icon="history"
			intent="warning"
			className="pub-historical-notice-component"
			title={`You're viewing an older ${isRelease ? 'release' : 'draft'} of this Pub.`}
		>
			{renderWarning()}
			{renderAction()}
		</Callout>
	);
};
export default PubHistoricalNotice;
