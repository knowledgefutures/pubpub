import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import dateFormat from 'dateformat';

import { apiFetch } from 'utils';
import { usePageContext } from 'utils/hooks';
import { Byline, ClickToCopyButton, Overlay, PubThemePicker } from 'components';
import { Menu, MenuItem } from 'components/Menu';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { getPubPublishedDate } from 'shared/pub/pubDates';
import { formatDate } from 'shared/utils/dates';

import CitationsPreview from './CitationsPreview';
import CollectionsBar from './collections/CollectionsBar';
import Download from './Download';
import EditableHeaderText from './EditableHeaderText';
import LargeHeaderButton from './LargeHeaderButton';
import PopoverButton from './PopoverButton';
import SharePanel from './SharePanel';
import SmallHeaderButton from './SmallHeaderButton';

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
		releases: PropTypes.arrayOf(PropTypes.shape({ createdAt: PropTypes.string })).isRequired,
		releaseNumber: PropTypes.number,
	}).isRequired,
	historyData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const getPublishDateString = (pubData) => {
	const publishedDate = getPubPublishedDate(
		pubData,
		pubData.branches.find((br) => br.title === 'public'),
	);
	if (publishedDate) {
		return dateFormat(publishedDate, 'mmm dd, yyyy');
	}
	return <i>Unpublished</i>;
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

const getPublishUrl = (pubData, publicBranch) => {
	const { slug, activeBranch } = pubData;
	return `/pub/${slug}/merge/${activeBranch.shortId}/${publicBranch.shortId}`;
};

const getReviewUrl = (pubData, publicBranch) => {
	const { slug, activeBranch } = pubData;
	return `/pub/${slug}/reviews/new/${activeBranch.shortId}/${publicBranch.shortId}`;
};

const PubHeaderMain = (props) => {
	const { pubData, updateLocalData, historyData } = props;
	const { title, description, doi } = pubData;
	const { communityData, scopeData } = usePageContext();
	const [isShareOpen, setIsShareOpen] = useState(false);

	const updateAndSavePubData = (newPubData) => {
		const oldPubData = { ...pubData };
		updateLocalData('pub', newPubData);
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				...newPubData,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		}).catch(() => updateLocalData('pub', oldPubData));
	};

	const { canManage, canEdit } = scopeData.activePermissions;
	const publishedAtString = getPublishDateString(pubData);

	const renderTop = () => {
		return (
			<div className="top">
				<CollectionsBar pubData={pubData} updateLocalData={updateLocalData} />
				<div className="basic-details">
					<span className="metadata-pair">
						<b className="pub-header-themed-secondary">Published on</b>
						{publishedAtString}
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
					<Byline pubData={pubData} />
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

					<SmallHeaderButton
						label="Share with..."
						labelPosition="left"
						icon="people"
						onClick={() => setIsShareOpen(true)}
					/>
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
				</div>
			</div>
		);
	};

	const renderReleaseBottomButtons = () => {
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
								active={index === releaseNumber - 1}
								icon={index === releaseNumber - 1 ? 'tick' : 'document-open'}
								href={pubUrl(communityData, pubData, { releaseNumber: index + 1 })}
								text={formatDate(release.createdAt, { includeTime: true })}
							/>
						))
						.reverse()}
				</Menu>
			</>
		);
	};

	const renderDraftBottomButtons = () => {
		const { releases } = pubData;
		const { latestKey, timestamps } = historyData;
		const latestTimestamp = timestamps[latestKey];
		const hasRelease = releases.length > 0;
		return (
			<>
				{hasRelease && (
					<LargeHeaderButton
						icon="document-open"
						tagName="a"
						href={pubUrl(communityData, pubData)}
						outerLabel={{ bottom: 'view latest release', top: 'see published version' }}
					/>
				)}
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
			</>
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
			<Overlay
				isOpen={isShareOpen}
				onClose={() => {
					setIsShareOpen(false);
				}}
			>
				<SharePanel pubData={pubData} updateLocalData={updateLocalData} />
			</Overlay>
			{renderTop()}
			<div className="hairline" />
			{renderMiddle()}
			{renderBottom()}
		</div>
	);
};

PubHeaderMain.propTypes = propTypes;
export default PubHeaderMain;
