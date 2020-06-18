import React from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Callout } from '@blueprintjs/core';

import { formatDate, datesAreSameCalendarDate } from 'utils/dates';
import { getPubLatestReleasedDate } from 'utils/pub/pubDates';
import { pubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';

require('./pubHistoricalNotice.scss');

const propTypes = {
	pubData: PropTypes.shape({
		releaseNumber: PropTypes.number,
		isRelease: PropTypes.bool,
		releases: PropTypes.arrayOf(
			PropTypes.shape({
				createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
			}),
		).isRequired,
	}).isRequired,
	historyData: PropTypes.shape({
		currentKey: PropTypes.number,
		latestKey: PropTypes.number,
		timestamps: PropTypes.object,
		loadedIntoHistory: PropTypes.bool,
	}).isRequired,
};

const PubHistoricalNotice = (props) => {
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
		const currentDate = new Date(timestamps[currentKey]);
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

PubHistoricalNotice.propTypes = propTypes;
export default PubHistoricalNotice;
