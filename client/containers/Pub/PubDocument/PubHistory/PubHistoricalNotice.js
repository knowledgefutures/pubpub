import React from 'react';

import { AnchorButton, Button, Callout } from '@blueprintjs/core';

import { formatDate, datesAreSameCalendarDate } from 'shared/utils/dates';
import { getPubLatestReleasedDate } from 'shared/pub/pubDates';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';

require('./pubHistoricalNotice.scss');

const propTypes = {};
const defaultProps = {};

const PubHistoricalNotice = (props) => {
	const { pubData, historyData, updateHistoryData } = props;
	const { communityData } = usePageContext();
	const { releases, currentReleaseIndex, isRelease } = pubData;
	const { currentKey, latestKey, timestamps } = historyData;

	if (currentKey === latestKey) {
		return null;
	}

	const handleFastForward = () =>
		updateHistoryData({ isViewingHistory: false, currentKey: latestKey });

	const renderWarning = () => {
		if (isRelease) {
			const currentReleaseDate = new Date(releases[currentReleaseIndex].createdAt);
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
				You're viewing a the draft of this Pub as it appeared{' '}
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
		if (isRelease) {
			return (
				<AnchorButton href={pubUrl(communityData, pubData)}>
					View the latest release
				</AnchorButton>
			);
		}
		return (
			<Button icon="fast-forward" onClick={handleFastForward}>
				See the latest draft
			</Button>
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
PubHistoricalNotice.defaultProps = defaultProps;
export default PubHistoricalNotice;
