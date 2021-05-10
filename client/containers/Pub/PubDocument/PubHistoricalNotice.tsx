import React, { useState } from 'react';
import classNames from 'classnames';
import { AnchorButton, Callout, Collapse, Icon } from '@blueprintjs/core';
import TimeAgo from 'react-timeago';

import { pubUrl } from 'utils/canonicalUrls';
import { datesAreSameCalendarDate, formatDate, timeAgoBaseProps } from 'utils/dates';
import { usePageContext } from 'utils/hooks';
import { getPubLatestReleasedDate } from 'utils/pub/pubDates';

import { ClickToCopyButton } from 'components';
import { Pub, Release } from 'types';

require('./pubHistoricalNotice.scss');

type Props = {
	pubData: Pub & {
		releaseNumber: number;
		isRelease: boolean;
		releases: Release[];
	};
	historyData: {
		currentKey: number;
		latestKey: number;
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
	const viewingNoun = isRelease ? `Release (#${releaseNumber})` : 'draft';

	const [showingChangelog, setShowingChangelog] = useState(false);

	if (!isHistoricalDraft && !isHistoricalRelease) {
		return null;
	}

	const toggleChangelog = () => setShowingChangelog(!showingChangelog);

	const renderChangelog = () => {
		if (isRelease) {
			const items = releases
				.map((release, index) => {
					const thisReleaseNumber = index + 1;
					const isLatestRelease = thisReleaseNumber === releases.length;
					const isViewedRelease = thisReleaseNumber === releaseNumber;
					const releaseUrl = pubUrl(communityData, pubData, {
						releaseNumber: thisReleaseNumber,
					});
					const noteText = release.noteText || '';
					const releaseTime = formatDate(new Date(release.createdAt), {
						includeTime: true,
					});
					return (
						<div className="release-item" key={release.createdAt}>
							<div className="item-block">
								<div className="icon-button">
									<Icon
										className="release-icon"
										icon={isViewedRelease ? 'tick' : 'document-share'}
									/>
									<ClickToCopyButton
										minimal
										className="copy-button"
										icon="duplicate"
										tooltipPosition="right"
										beforeCopyPrompt={`Copy link to Release #${thisReleaseNumber}`}
										afterCopyPrompt="Copied link!"
										copyString={releaseUrl}
									/>
								</div>
								<div className="release-metadata">
									<a className="release-num" href={releaseUrl}>
										Release #{thisReleaseNumber}
									</a>
									<p className="release-timestamp-humanized">
										<TimeAgo {...timeAgoBaseProps} date={release.createdAt} />
									</p>
									<p className="release-timestamp">{releaseTime}</p>
									{(isViewedRelease || isLatestRelease) && (
										<p className="release-label">
											{isLatestRelease && 'latest'}
											{isViewedRelease && 'now viewing'}
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
									className={classNames('note', !noteText && 'empty')}
									// eslint-disable-next-line react/no-danger
									dangerouslySetInnerHTML={{
										__html: noteText || 'No Release Note',
									}}
								/>
							</div>
						</div>
					);
				})
				.reverse();
			return (
				<Collapse className="changelog" isOpen={showingChangelog}>
					<Callout
						icon="properties"
						intent="primary"
						className="changelog-callout"
						title="Changelog"
					>
						{items}
					</Callout>
				</Collapse>
			);
		}
		return null;
	};

	const renderWarning = () => {
		if (isRelease) {
			const currentReleaseDate = new Date(releases[releaseNumber - 1].createdAt);
			const latestReleaseDate = getPubLatestReleasedDate(pubData)!;
			const includeTime = datesAreSameCalendarDate(currentReleaseDate, latestReleaseDate);

			return (
				<ul className="warning-desc">
					<li>
						This Release <b>(#{releaseNumber})</b> was created{' '}
						{formatDate(currentReleaseDate, {
							includeTime,
							includePreposition: true,
						})}{' '}
						<span className="humanized-time">
							(<TimeAgo {...timeAgoBaseProps} date={currentReleaseDate} />)
						</span>
					</li>
					<li>
						The latest Release <b>(#{pubData.releases.length})</b> was created{' '}
						{formatDate(latestReleaseDate, {
							includeTime,
							includePreposition: true,
						})}{' '}
						<span className="humanized-time">
							{' ('}
							<TimeAgo {...timeAgoBaseProps} date={latestReleaseDate} />
							).
						</span>
					</li>
				</ul>
			);
		}
		const currentDate = new Date(timestamps[currentKey]);
		const latestDate = new Date(timestamps[latestKey]);
		const includeTime = datesAreSameCalendarDate(currentDate, latestDate);
		return (
			<p>
				You're viewing a draft of this Pub as it appeared{' '}
				{formatDate(currentDate, { includeTime, includePreposition: true })}. It was most
				recently updated{' '}
				{formatDate(latestDate, {
					includeTime,
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
				title={`You're viewing an older ${viewingNoun} of this Pub.`}
			>
				{renderWarning()}
				{renderAction()}
			</Callout>
			{renderChangelog()}
		</div>
	);
};
export default PubHistoricalNotice;
