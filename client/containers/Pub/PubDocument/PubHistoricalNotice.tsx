import { AnchorButton, Callout, Collapse, Icon } from '@blueprintjs/core';
import React, { useState } from 'react';
import TimeAgo from 'react-timeago';

import { pubUrl } from 'utils/canonicalUrls';
import { datesAreSameCalendarDate, formatDate, timeAgoBaseProps } from 'utils/dates';
import { usePageContext } from 'utils/hooks';
import { getPubLatestReleasedDate } from 'utils/pub/pubDates';

import { ClickToCopyButton } from 'components';

require('./pubHistoricalNotice.scss');

type Props = {
	pubData: {
		releaseNumber?: number;
		isRelease?: boolean;
		releases: {
			createdAt?: string | any; // TODO: PropTypes.instanceOf(Date)
			noteText: string;
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

	const [showingChangelog, setShowingChangelog] = useState(false);

	if (!isHistoricalDraft && !isHistoricalRelease) {
		return null;
	}

	const toggleChangelog = () => {
		!showingChangelog ? setShowingChangelog(true) : setShowingChangelog(false);
	};

	const renderChangelog = () => {
		if (isRelease) {
			const items = releases
				.map((release, i) => (
					<div className="release-item" key={release.createdAt}>
						<div className="item-block">
							<div className="icon-button">
								<Icon
									className="release-icon"
									icon={releaseNumber == i + 1 ? 'tick' : 'document-share'}
									// iconSize={18}
								/>
								<ClickToCopyButton
									className="copy-button"
									minimal={true}
									icon="duplicate"
									tooltipPosition="right"
									beforeCopyPrompt={'Copy link to Release #' + (i + 1)}
									afterCopyPrompt={'Copied link to Release #' + (i + 1) + '!'}
									copyString={pubUrl(communityData, pubData, {
										releaseNumber: i + 1,
									})}
								/>
							</div>
							<div className="release-metadata">
								<a
									className="release-num"
									href={pubUrl(communityData, pubData, {
										releaseNumber: i + 1,
									})}
								>
									Release #{i + 1}
								</a>
								<p className="release-timestamp-humanized">
									<TimeAgo {...timeAgoBaseProps} date={release.createdAt} />
								</p>
								<p className="release-timestamp">
									{' '}
									{formatDate(new Date(release.createdAt), {
										includeTime: true,
									})}
								</p>
								{(i + 1 == releases.length || releaseNumber == i + 1) && (
									<p className="release-label">
										{i + 1 == releases.length && 'latest'}
										{releaseNumber == i + 1 && 'now viewing'}
									</p>
								)}
							</div>
						</div>
						<div className="item-block">
							<Icon
								className="note-icon"
								icon="manually-entered-data"
								iconSize={12}
							/>
							<div
								className={`note ${!release.noteText.length ? ' empty' : ''}`}
								dangerouslySetInnerHTML={{
									__html: !release.noteText.length
										? 'No Release Note'
										: release.noteText,
								}}
							/>
						</div>
					</div>
				))
				.reverse();
			return (
				<Collapse className="changelog" isOpen={showingChangelog}>
					<Callout
						icon="properties"
						intent="primary"
						className="changelog-callout"
						title={`Changelog`}
					>
						{items}
					</Callout>
				</Collapse>
			);
		}
	};

	const renderWarning = () => {
		if (isRelease) {
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			const currentReleaseDate = new Date(releases[releaseNumber - 1].createdAt);
			const latestReleaseDate = getPubLatestReleasedDate(pubData);
			const includeTime = datesAreSameCalendarDate(currentReleaseDate, latestReleaseDate);

			return (
				<ul className="warning-desc">
					<li>
						This Release <b>(#{releaseNumber})</b> was created{' '}
						{formatDate(currentReleaseDate, {
							includeTime: includeTime,
							includePreposition: true,
						})}{' '}
						<span className="humanized-time">
							{' ('}
							<TimeAgo {...timeAgoBaseProps} date={currentReleaseDate} />
							{').'}
						</span>
					</li>
					<li>
						The latest Release <b>(#{pubData.releases.length})</b> was created{' '}
						{formatDate(latestReleaseDate, {
							includeTime: includeTime,
							includePreposition: true,
						})}{' '}
						<span className="humanized-time">
							{' ('}
							<TimeAgo {...timeAgoBaseProps} date={latestReleaseDate} />
							{').'}
						</span>
					</li>
				</ul>
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
			<div>
				<AnchorButton
					className="callout-button"
					intent="primary"
					outlined
					href={pubUrl(communityData, pubData, { isDraft: !isRelease })}
				>
					{isRelease ? 'Go to latest Release' : 'Go to latest draft'}
				</AnchorButton>
				{isRelease && (
					<AnchorButton
						className="callout-button changelog-button"
						intent="primary"
						outlined
						onClick={toggleChangelog}
						rightIcon={showingChangelog ? 'collapse-all' : 'expand-all'}
					>
						{showingChangelog ? 'Hide Changelog' : 'Show Changelog'}
					</AnchorButton>
				)}
			</div>
		);
	};

	return (
		<div className="pub-historical-notice-component">
			<Callout
				icon="history"
				intent="warning"
				title={`You're viewing an older ${
					isRelease ? 'Release (#' + releaseNumber + ')' : 'draft'
				} of this Pub.`}
			>
				{renderWarning()}
				{renderAction()}
			</Callout>
			{renderChangelog()}
		</div>
	);
};
export default PubHistoricalNotice;
