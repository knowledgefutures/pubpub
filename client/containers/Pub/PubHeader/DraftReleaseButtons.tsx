import React from 'react';
import TimeAgo from 'react-timeago';

import { DialogLauncher, PubReleaseDialog, PubReleaseReviewDialog } from 'components';
import { PatchFn, PubPageData } from 'types';
import { Menu, MenuItem } from 'components/Menu';
import { pubUrl } from 'utils/canonicalUrls';
import { formatDate } from 'utils/dates';
import { usePageContext } from 'utils/hooks';

import { usePubContext } from '../pubHooks';
import ResponsiveHeaderButton from './ResponsiveHeaderButton';

require('./draftReleaseButtons.scss');

export type DraftReleaseButtonsProps = {
	pubData: PubPageData;
	historyData: any;
	updatePubData: PatchFn<PubPageData>;
};

export const getHistoryButtonLabelForTimestamp = (timestamp, label, noTimestampLabel) => {
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

const getCanCreateRelease = (latestRelease, latestKey) => {
	if (latestRelease) {
		const { historyKey } = latestRelease;
		return typeof historyKey !== 'number' || historyKey < latestKey;
	}
	return latestKey !== -1;
};

const DraftReleaseButtons = (props: DraftReleaseButtonsProps) => {
	const { historyData, pubData, updatePubData } = props;
	const { communityData, scopeData } = usePageContext();
	const { submissionState } = usePubContext();
	const { canView, canViewDraft, canAdmin, canCreateReviews } = scopeData.activePermissions;
	const { isRelease, isReviewingPub, isAVisitingCommenter } = pubData;
	const shouldShowReleaseReviewButton = canCreateReviews && !isReviewingPub && !submissionState;
	const renderForRelease = () => {
		const { releases, releaseNumber } = pubData;
		const latestReleaseTimestamp = new Date(releases[releases.length - 1].createdAt).valueOf();
		return (
			<React.Fragment>
				{(canView || canViewDraft) && !isAVisitingCommenter && (
					<ResponsiveHeaderButton
						icon="edit"
						tagName="a"
						href={pubUrl(communityData, pubData, { isDraft: true })}
						outerLabel={{
							top: 'edit this Pub',
							bottom: 'go to draft',
						}}
					/>
				)}
				{!isReviewingPub && (
					<Menu
						className="releases-menu"
						aria-label="Choose a historical release of this Pub"
						disclosure={
							<ResponsiveHeaderButton
								icon="history"
								showCaret={true}
								// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
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
									active={index + 1 === releaseNumber}
									icon={index + 1 === releaseNumber ? 'tick' : 'document-share'}
									href={pubUrl(communityData, pubData, {
										releaseNumber: index + 1,
									})}
									className="release-menu-item"
									text={
										<div className="release-metadata">
											<p className="number">{'Release #' + (index + 1)}</p>
											<p className="timestamp">
												{formatDate(new Date(release.createdAt), {
													includeTime: true,
												})}
											</p>
										</div>
									}
								/>
							))
							.reverse()}
					</Menu>
				)}
			</React.Fragment>
		);
	};

	const renderForDraft = () => {
		const { releases } = pubData;
		const { latestKey, timestamps } = historyData;
		const latestRelease = releases[releases.length - 1];
		const latestTimestamp = timestamps[latestKey];
		const canRelease = getCanCreateRelease(latestRelease, latestKey);
		return (
			<React.Fragment>
				<ResponsiveHeaderButton
					icon="history"
					className="draft-history-button"
					// @ts-expect-error
					active={historyData.isViewingHistory}
					outerLabel={getHistoryButtonLabelForTimestamp(
						latestTimestamp,
						'draft last updated',
						'draft created',
					)}
					disabled={historyData.loadedIntoHistory}
					onClick={() => historyData.setIsViewingHistory(!historyData.isViewingHistory)}
				/>
				{!!latestRelease && (
					<ResponsiveHeaderButton
						icon="globe"
						tagName="a"
						href={pubUrl(communityData, pubData)}
						outerLabel={{ bottom: 'view latest release', top: 'see published version' }}
					/>
				)}
				{canAdmin && !isReviewingPub && !isAVisitingCommenter && (
					<DialogLauncher
						renderLauncherElement={({ openDialog }) => (
							<ResponsiveHeaderButton
								disabled={!canRelease}
								icon="document-share"
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
								pub={pubData}
								historyKey={historyData?.latestKey}
								onCreateRelease={(release) =>
									updatePubData((currentPubData) => {
										return {
											releases: [...currentPubData.releases, release],
										};
									})
								}
							/>
						)}
					</DialogLauncher>
				)}
				{shouldShowReleaseReviewButton && !isAVisitingCommenter && (
					<DialogLauncher
						renderLauncherElement={({ openDialog }) => (
							<ResponsiveHeaderButton
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
								updatePubData={updatePubData}
							/>
						)}
					</DialogLauncher>
				)}
			</React.Fragment>
		);
	};

	return (
		<div className="draft-release-buttons-component">
			{isRelease ? renderForRelease() : renderForDraft()}
		</div>
	);
};
export default DraftReleaseButtons;
