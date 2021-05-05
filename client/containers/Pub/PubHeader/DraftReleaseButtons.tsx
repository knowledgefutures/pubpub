import React from 'react';
import TimeAgo from 'react-timeago';

import { DialogLauncher, PubReleaseDialog, PubReleaseReviewDialog } from 'components';
import { Menu, MenuItem } from 'components/Menu';
import { pubUrl } from 'utils/canonicalUrls';
import { formatDate } from 'utils/dates';
import { usePageContext } from 'utils/hooks';

import { PatchFn, PubPageData } from 'types';
import ResponsiveHeaderButton from './ResponsiveHeaderButton';

require('./draftReleaseButtons.scss');

export type DraftReleaseButtonsProps = {
	pubData: PubPageData;
	historyData: any;
	updatePubData: PatchFn<PubPageData>;
	updateHistoryData: (patch: any) => unknown;
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

const getCanCreateRelease = (latestRelease, latestKey) => {
	if (latestRelease) {
		const { historyKey } = latestRelease;
		return typeof historyKey !== 'number' || historyKey < latestKey;
	}
	return latestKey !== -1;
};

const DraftReleaseButtons = (props: DraftReleaseButtonsProps) => {
	const { historyData, pubData, updateHistoryData, updatePubData } = props;
	const { communityData, scopeData } = usePageContext();
	const { canView, canViewDraft, canAdmin, canCreateReviews } = scopeData.activePermissions;
	const { isRelease } = pubData;

	const renderForRelease = () => {
		const { releases, releaseNumber } = pubData;
		const latestReleaseTimestamp = new Date(releases[releases.length - 1].createdAt).valueOf();
		return (
			<React.Fragment>
				{(canView || canViewDraft) && (
					<ResponsiveHeaderButton
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ icon: string; tagName: string; href: strin... Remove this comment to see the full error message
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
					className="releases-menu"
					aria-label="Choose a historical release of this Pub"
					disclosure={
						<ResponsiveHeaderButton
							// @ts-expect-error ts-migrate(2322) FIXME: Type '{ icon: string; showCaret: true; outerLabel:... Remove this comment to see the full error message
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
								href={pubUrl(communityData, pubData, { releaseNumber: index + 1 })}
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
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ icon: string; className: string; active: a... Remove this comment to see the full error message
					icon="history"
					className="draft-history-button"
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
					<ResponsiveHeaderButton
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ icon: string; tagName: string; href: strin... Remove this comment to see the full error message
						icon="globe"
						tagName="a"
						href={pubUrl(communityData, pubData)}
						outerLabel={{ bottom: 'view latest release', top: 'see published version' }}
					/>
				)}
				{canAdmin && (
					<DialogLauncher
						renderLauncherElement={({ openDialog }) => (
							<ResponsiveHeaderButton
								// @ts-expect-error ts-migrate(2322) FIXME: Type '{ disabled: boolean; icon: string; onClick: ... Remove this comment to see the full error message
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
								pubData={pubData}
								historyData={historyData}
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
				{canCreateReviews && (
					<DialogLauncher
						renderLauncherElement={({ openDialog }) => (
							<ResponsiveHeaderButton
								// @ts-expect-error ts-migrate(2322) FIXME: Type '{ disabled: boolean; icon: string; onClick: ... Remove this comment to see the full error message
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
