import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import dateFormat from 'dateformat';
import { usePopoverState, PopoverDisclosure, Popover } from 'reakit';
import { Card } from '@blueprintjs/core';

import { apiFetch } from 'utils';
import { ClickToCopyButton, Overlay } from 'components';
import { getPubPublishedDate, getPubUpdatedDate } from 'shared/pub/pubDates';

import BranchSelectorButton from './BranchSelectorButton';
import Byline from './Byline';
import CitationsPreview from './CitationsPreview';
import CollectionsBar from './collections/CollectionsBar';
import Download from './Download';
import EditableHeaderText from './EditableHeaderText';
import LargeHeaderButton from './LargeHeaderButton';
import SharePanel from './SharePanel';
import SmallHeaderButton from './SmallHeaderButton';
import ThemePicker from './ThemePicker';

const propTypes = {
	pubData: PropTypes.shape({
		canManage: PropTypes.bool.isRequired,
		description: PropTypes.string,
		doi: PropTypes.string,
		slug: PropTypes.string,
		title: PropTypes.string.isRequired,
	}).isRequired,
	historyData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PopoverButton = (props) => {
	const { component: Component, 'aria-label': ariaLabel, children, ...restProps } = props;
	const popover = usePopoverState({ unstable_fixed: true, placement: 'bottom-end', gutter: 5 });
	return (
		<>
			<PopoverDisclosure {...popover} {...children.props}>
				{(disclosureProps) => {
					return React.cloneElement(children, disclosureProps);
				}}
			</PopoverDisclosure>
			<Popover
				className="pub-header-popover"
				unstable_portal={true}
				tabIndex={0}
				{...popover}
			>
				<Card elevation={2}>
					<Component {...restProps} />
				</Card>
			</Popover>
		</>
	);
};

const getPublishDateString = (pubData) => {
	const publishedDate = getPubPublishedDate(
		pubData,
		pubData.branches.find((br) => br.title === 'public'),
	);
	if (publishedDate) {
		dateFormat(publishedDate, 'mmm dd, yyyy');
	}
	return <i>Unpublished</i>;
};

const getHistoryButtonLabel = (pubData, historyData) => {
	const updatedAtDate = getPubUpdatedDate({
		pub: pubData,
		branch: pubData.activeBranch,
		historyData: historyData,
	});
	if (updatedAtDate) {
		const now = Date.now();
		const justNow = now - updatedAtDate < 60 * 1000;
		const timeAgo = justNow ? 'just now' : <TimeAgo date={updatedAtDate} minPeriod={60} />;
		return {
			top: 'this branch last updated',
			bottom: timeAgo,
		};
	}
	return {
		top: 'this branch created',
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
	const { pubData, updateLocalData, communityData, historyData } = props;
	const { canManage, title, description, doi, activeBranch } = pubData;
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

	const publishedAtString = getPublishDateString(pubData);
	const publicBranch = pubData.branches.find((branch) => branch.title === 'public');
	const onPublicBranch = activeBranch.title === 'public';
	const canSubmitForReview = !onPublicBranch && activeBranch.canManage;
	const canPublish = !onPublicBranch && activeBranch.canManage && publicBranch.canManage;

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
			<div className="hairline" />
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
							component={ThemePicker}
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
			<div className="bottom">
				<BranchSelectorButton pubData={pubData} />
				<LargeHeaderButton
					icon="history"
					outerLabel={getHistoryButtonLabel(pubData, historyData)}
					onClick={() =>
						updateLocalData('history', {
							isViewingHistory: !historyData.isViewingHistory,
						})
					}
				/>
				{canPublish && (
					<LargeHeaderButton
						href={getPublishUrl(pubData, publicBranch)}
						label={{
							top: 'Publish',
							bottom: 'Merge into #public',
						}}
					/>
				)}
				{canSubmitForReview && (
					<LargeHeaderButton
						tagName="a"
						href={getReviewUrl(pubData, publicBranch)}
						label={{
							top: 'Submit for review',
							bottom: 'to #public',
						}}
					/>
				)}
			</div>
		</div>
	);
};

PubHeaderMain.propTypes = propTypes;
export default PubHeaderMain;
