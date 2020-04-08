import React from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import dateFormat from 'dateformat';

import { apiFetch } from 'utils';
import { usePageContext } from 'utils/hooks';
import {
	Byline,
	ClickToCopyButton,
	DialogLauncher,
	MembersDialog,
	PubAttributionDialog,
	PubReleaseDialog,
	PubReleaseReviewDialog,
	PubThemePicker,
} from 'components';
import { Menu, MenuItem } from 'components/Menu';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { getPubPublishedDate } from 'shared/pub/pubDates';
import { formatDate } from 'shared/utils/dates';

import BylineEditButton from './BylineEditButton';
import CitationsPreview from './CitationsPreview';
import CollectionsBar from './collections/CollectionsBar';
import Download from './Download';
import EditableHeaderText from './EditableHeaderText';
import LargeHeaderButton from './LargeHeaderButton';
import PopoverButton from './PopoverButton';
import Social from './Social';
import SmallHeaderButton from './SmallHeaderButton';
import PubToc from './PubToc';

const propTypes = {
	pubData: PropTypes.shape({
		activeBranch: PropTypes.object.isRequired,
		branches: PropTypes.array.isRequired,
		description: PropTypes.string,
		doi: PropTypes.string,
		isRelease: PropTypes.bool,
		id: PropTypes.string.isRequired,
		slug: PropTypes.string.isRequired,
		title: PropTypes.string.isRequired,
		membersData: PropTypes.shape({
			members: PropTypes.array,
		}).isRequired,
		releases: PropTypes.arrayOf(
			PropTypes.shape({ createdAt: PropTypes.string, sourceBranchKey: PropTypes.number }),
		).isRequired,
		releaseNumber: PropTypes.number,
	}).isRequired,
	pubHeadings: PropTypes.array.isRequired,
	historyData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
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

const PubHeaderMain = (props) => {
	const { pubData, updateLocalData, historyData, pubHeadings } = props;
	const { title, description, doi, membersData } = pubData;
	const { communityData, scopeData } = usePageContext();

	const { canManage, canEdit, canAdmin } = scopeData.activePermissions;
	const publishedDate = getPubPublishedDate(
		pubData,
		pubData.branches.find((br) => br.title === 'public'),
	);

	const updatePubData = (newPubData) => {
		return updateLocalData('pub', newPubData, { isImmediate: true });
	};

	const updateAndSavePubData = (newPubData) => {
		const oldPubData = { ...pubData };
		updatePubData(newPubData);
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				...newPubData,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		}).catch(() => updateLocalData('pub', oldPubData));
	};

	const renderTop = () => {
		return (
			<div className="top">
				<CollectionsBar pubData={pubData} updateLocalData={updateLocalData} />
				<div className="basic-details">
					<span className="metadata-pair">
						{publishedDate && (
							<b className="pub-header-themed-secondary">Published on</b>
						)}
						{publishedDate ? (
							dateFormat(publishedDate, 'mmm dd, yyyy')
						) : (
							<i>Unpublished</i>
						)}
					</span>
					{doi && (
						<span className="metadata-pair doi-pair">
							<b className="pub-header-themed-secondary">DOI</b>
							<ClickToCopyButton
								copyString={`https://doi.org/${doi}`}
								className="click-to-copy"
								beforeCopyPrompt="Copy doi.org link"
								icon={null}
							>
								{doi}
							</ClickToCopyButton>
						</span>
					)}
					<div className="show-details-placeholder" />
				</div>
			</div>
		);
	};

	const renderBylineEditor = () => {
		if (!canManage) {
			return null;
		}
		return (
			<>
				{' '}
				<DialogLauncher
					renderLauncherElement={({ openDialog }) => (
						<BylineEditButton onClick={openDialog} />
					)}
				>
					{({ isOpen, onClose }) => (
						<PubAttributionDialog
							canEdit={true}
							isOpen={isOpen}
							onClose={onClose}
							pubData={pubData}
							communityData={communityData}
							updatePubData={updatePubData}
						/>
					)}
				</DialogLauncher>
			</>
		);
	};

	const renderMiddle = () => {
		return (
			<div className="middle">
				<div className="left">
					<EditableHeaderText
						text={title}
						updateText={(text) => updateAndSavePubData({ title: text })}
						canEdit={canManage}
						className="title"
						placeholder="Add a Pub title"
					/>
					{(canManage || description) && (
						<EditableHeaderText
							text={description}
							updateText={(text) => updateAndSavePubData({ description: text })}
							canEdit={canManage}
							tagName="h3"
							className="description pub-header-themed-secondary"
							placeholder="Add a description for this Pub"
						/>
					)}
					<Byline pubData={pubData} renderSuffix={renderBylineEditor} />
				</div>
				<div className="right">
					{canManage && (
						<PopoverButton
							component={PubThemePicker}
							updatePubData={updateAndSavePubData}
							pubData={pubData}
							communityData={communityData}
							aria-label="Pub header theme options"
						>
							<SmallHeaderButton
								label="Edit theme"
								labelPosition="left"
								icon="clean"
							/>
						</PopoverButton>
					)}
					{canManage && (
						<SmallHeaderButton
							label="Pub settings"
							labelPosition="left"
							icon="cog"
							tagName="a"
							href={`/pub/${pubData.slug}/manage`}
						/>
					)}
					{membersData && (
						<DialogLauncher
							renderLauncherElement={({ openDialog }) => (
								<SmallHeaderButton
									label="Members"
									labelPosition="left"
									icon="people"
									onClick={openDialog}
								/>
							)}
						>
							{({ isOpen, onClose }) => (
								<MembersDialog
									isOpen={isOpen}
									onClose={onClose}
									members={membersData.members}
								/>
							)}
						</DialogLauncher>
					)}
					<Download pubData={pubData}>
						<SmallHeaderButton label="Download" labelPosition="left" icon="download2" />
					</Download>
					<PopoverButton
						component={CitationsPreview}
						pubData={pubData}
						aria-label="Cite this Pub"
					>
						<SmallHeaderButton label="Cite" labelPosition="left" icon="cite" />
					</PopoverButton>
					<Social pubData={pubData}>
						<SmallHeaderButton label="Share" labelPosition="left" icon="share2" />
					</Social>
					{pubHeadings.length > 0 && (
						<PubToc headings={pubHeadings}>
							<SmallHeaderButton
								label="Table of Contents"
								labelPosition="left"
								icon="toc"
							/>
						</PubToc>
					)}
				</div>
			</div>
		);
	};

	const renderReleaseBottomButtons = () => {
		const { releases, releaseNumber } = pubData;
		const latestReleaseTimestamp = new Date(releases[releases.length - 1].createdAt).valueOf();
		return (
			<React.Fragment>
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
			</React.Fragment>
		);
	};

	const renderDraftBottomButtons = () => {
		const { releases } = pubData;
		const { latestKey, timestamps } = historyData;
		const latestRelease = releases[releases.length - 1];
		const latestTimestamp = timestamps[latestKey];
		const canRelease =
			!latestRelease ||
			typeof latestRelease.sourceBranchKey !== 'number' ||
			latestRelease.sourceBranchKey < latestKey;
		return (
			<React.Fragment>
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
						updateLocalData('history', {
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
								updatePubData={(newPubData) => updateLocalData('pub', newPubData)}
							/>
						)}
					</DialogLauncher>
				)}
			</React.Fragment>
		);
	};

	const renderBottom = () => {
		return (
			<div className="bottom">
				{pubData.isRelease ? renderReleaseBottomButtons() : renderDraftBottomButtons()}
			</div>
		);
	};

	return (
		<div className="pub-header-main-component">
			{renderTop()}
			<div className="hairline" />
			{renderMiddle()}
			{renderBottom()}
		</div>
	);
};

PubHeaderMain.propTypes = propTypes;
export default PubHeaderMain;
