import React from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';

import { usePageContext } from 'utils/hooks';
import { DialogLauncher, PubReleaseDialog, PubReleaseReviewDialog } from 'components';
import { Menu, MenuItem } from 'components/Menu';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { formatDate } from 'shared/utils/dates';

import LargeHeaderButton from './LargeHeaderButton';
import PubToc from './PubToc';

const propTypes = {
	pubData: PropTypes.shape({
		isRelease: PropTypes.bool,
		releases: PropTypes.arrayOf(
			PropTypes.shape({ createdAt: PropTypes.string, sourceBranchKey: PropTypes.number }),
		).isRequired,
		releaseNumber: PropTypes.number,
	}).isRequired,
	historyData: PropTypes.object.isRequired,
	updatePubData: PropTypes.func.isRequired,
	updateHistoryData: PropTypes.func.isRequired,
	pubHeadings: PropTypes.array.isRequired,
	showTocButton: PropTypes.bool,
};

const defaultProps = {
	showTocButton: false,
};

const getHistoryButtonLabelForTimestamp = (timestamp, label, noTimestampLabel) => {
	if (timestamp) {
		const now = Date.now();
		const justNow = now - timestamp < 60 * 1000;
		const timeAgo = justNow ? 'just now' : <TimeAgo date={timestamp} minPeriod={60} />;
		return {
			top: label,
			bottom: timeAgo,
		};
	}
	return {
		top: noTimestampLabel,
		bottom: 'just now',
	};
};

const DraftReleaseButtons = (props) => {
	const {
		historyData,
		pubData,
		pubHeadings,
		updateHistoryData,
		updatePubData,
		showTocButton,
	} = props;
	const { communityData, scopeData } = usePageContext();
	const { canEdit, canAdmin } = scopeData.activePermissions;
	const { isRelease } = pubData;

	const renderTocButton = () => {
		if (pubHeadings.length > 0 && showTocButton) {
			return (
				<PubToc headings={pubHeadings} placement="bottom-start">
					<LargeHeaderButton outerLabel="Contents" icon="toc" />
				</PubToc>
			);
		}
		return null;
	};

	const renderForRelease = () => {
		const { releases, releaseNumber } = pubData;
		const latestReleaseTimestamp = new Date(releases[releases.length - 1].createdAt).valueOf();
		return (
			<>
				{canEdit && (
					<LargeHeaderButton
						icon="edit"
						tagName="a"
						href={pubUrl(communityData, pubData, { isDraft: true })}
						outerLabel={{
							top: 'edit this Pub',
							bottom: 'go to draft',
						}}
					/>
				)}
				<Menu
					aria-label="Choose a historical release of this Pub"
					disclosure={
						<LargeHeaderButton
							icon="history"
							showCaret={true}
							outerLabel={getHistoryButtonLabelForTimestamp(
								latestReleaseTimestamp,
								'last released',
							)}
						/>
					}
				>
					{releases
						.map((release, index) => (
							<MenuItem
								key={release.id}
								active={index === releaseNumber - 1}
								icon={index === releaseNumber - 1 ? 'tick' : 'document-open'}
								href={pubUrl(communityData, pubData, { releaseNumber: index + 1 })}
								text={formatDate(release.createdAt, { includeTime: true })}
							/>
						))
						.reverse()}
				</Menu>
				{renderTocButton()}
			</>
		);
	};

	const renderForDraft = () => {
		const { releases } = pubData;
		const { latestKey, timestamps } = historyData;
		const latestRelease = releases[releases.length - 1];
		const latestTimestamp = timestamps[latestKey];
		const canRelease =
			!latestRelease ||
			typeof latestRelease.sourceBranchKey !== 'number' ||
			latestRelease.sourceBranchKey < latestKey;
		return (
			<>
				<LargeHeaderButton
					icon="history"
					active={historyData.isViewingHistory}
					outerLabel={getHistoryButtonLabelForTimestamp(
						latestTimestamp,
						'draft last updated',
						'draft created',
					)}
					disabled={historyData.loadedIntoHistory}
					onClick={() =>
						updateHistoryData({
							isViewingHistory: !historyData.isViewingHistory,
						})
					}
				/>
				{!!latestRelease && (
					<LargeHeaderButton
						icon="document-open"
						tagName="a"
						href={pubUrl(communityData, pubData)}
						outerLabel={{ bottom: 'view latest release', top: 'see published version' }}
					/>
				)}
				{canAdmin && (
					<DialogLauncher
						renderLauncherElement={({ openDialog }) => (
							<LargeHeaderButton
								disabled={!canRelease}
								icon="globe"
								onClick={openDialog}
								label={{ bottom: 'Create a Release', top: 'Publish' }}
							/>
						)}
					>
						{({ isOpen, onClose, key }) => (
							<PubReleaseDialog
								key={key}
								isOpen={isOpen}
								onClose={onClose}
								pubData={pubData}
								historyData={historyData}
								updatePubData={updatePubData}
							/>
						)}
					</DialogLauncher>
				)}
				{!canAdmin && (
					<DialogLauncher
						renderLauncherElement={({ openDialog }) => (
							<LargeHeaderButton
								disabled={!canRelease}
								icon="social-media"
								onClick={openDialog}
								label={{
									bottom: 'Create a Release Review',
									top: 'Request Publication',
								}}
							/>
						)}
					>
						{({ isOpen, onClose, key }) => (
							<PubReleaseReviewDialog
								key={key}
								isOpen={isOpen}
								onClose={onClose}
								pubData={pubData}
								historyData={historyData}
								updatePubData={updatePubData}
							/>
						)}
					</DialogLauncher>
				)}
				{renderTocButton()}
			</>
		);
	};

	return (
		<div className="draft-release-buttons-component">
			{isRelease ? renderForRelease() : renderForDraft()}
		</div>
	);
};

DraftReleaseButtons.propTypes = propTypes;
DraftReleaseButtons.defaultProps = defaultProps;
export default DraftReleaseButtons;
