import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Tooltip } from '@blueprintjs/core';
import { Icon } from 'components';
import { apiFetch } from 'utils';
import { usePageContext } from 'utils/hooks';
import ThreadComment from './ThreadComment';
import DiscussionInput from './DiscussionInput';
import LabelList from './LabelList';
import LabelSelect from './LabelSelect';
import DiscussionReanchor from './DiscussionReanchor';
import { discussionMatchesSearchTerm } from '../discussionUtils';

require('./discussion.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	discussionData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	canPreview: PropTypes.bool,
	searchTerm: PropTypes.string,
};

const defaultProps = {
	firebaseBranchRef: undefined,
	canPreview: false,
	searchTerm: null,
};

const Discussion = (props) => {
	const {
		pubData,
		discussionData,
		canPreview,
		searchTerm,
		updateLocalData,
		collabData,
		firebaseBranchRef,
	} = props;
	const { communityData, scopeData, loginData, locationData } = usePageContext();
	const { canView, canCreateDiscussion } = scopeData.activePermissions;
	const [previewExpanded, setPreviewExpanded] = useState(false);
	const [isLoadingArchive, setIsLoadingArchive] = useState(false);
	const isPreview = canPreview && !previewExpanded;

	const renderPreviewDiscussionsAndOverflow = (threadComments, minShown) => {
		let shownDiscussionsCount = 0;
		let pendingHiddenCount = 0;
		const elements = [];

		const flushPendingCount = (discussionId) => {
			if (pendingHiddenCount > 0) {
				elements.push(
					<div key={discussionId} className="overflow-listing">
						{' '}
						+ {pendingHiddenCount} more...
					</div>,
				);
			}
			pendingHiddenCount = 0;
		};

		threadComments.forEach((threadComment, index) => {
			const isRootThread = index === 0;
			const meetsMinimum = shownDiscussionsCount < minShown;
			const matchesSearch = discussionMatchesSearchTerm(threadComment, searchTerm);
			const isPreviewDiscussion = isRootThread || !matchesSearch;
			if (isRootThread || meetsMinimum || matchesSearch) {
				++shownDiscussionsCount;
				flushPendingCount(threadComment.id);
				elements.push(
					<ThreadComment
						key={threadComment.id}
						threadCommentData={threadComment}
						isPreview={isPreviewDiscussion}
						// isRootThread={isRootThread}
						{...props}
					/>,
				);
			} else {
				++pendingHiddenCount;
			}
		});

		flushPendingCount('root');
		return elements;
	};

	const renderDiscussions = () => {
		// const filteredDiscussions = threadData.filter((discussion) => discussion.threadNumber);
		const filteredThreadComments = discussionData.thread.comments;
		if (isPreview) {
			return renderPreviewDiscussionsAndOverflow(filteredThreadComments, 2);
		}
		return filteredThreadComments.map((item) => {
			return (
				<ThreadComment
					key={item.id}
					threadCommentData={item}
					isPreview={isPreview}
					// isRootThread={index === 0}
					{...props}
				/>
			);
		});
	};
	const handlePutDiscussion = (discussionUpdates) => {
		return apiFetch('/api/discussions', {
			method: 'PUT',
			body: JSON.stringify({
				...discussionUpdates,
				accessHash: locationData.query.access,
				discussionId: discussionData.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		}).then((updatedDiscussionData) => {
			updateLocalData('pub', {
				discussions: pubData.discussions.map((discussion) => {
					if (discussion.id === discussionData.id) {
						return {
							...discussion,
							...updatedDiscussionData, // Hack to get thread edits in place
						};
					}
					return discussion;
				}),
			});
		});
	};
	const isDiscussionAuthor = loginData.id === discussionData.userId;
	return (
		<div
			tabIndex={-1}
			role="button"
			className={classNames(
				'discussion-component',
				isPreview && 'preview',
				previewExpanded && 'expanded-preview',
			)}
			onClick={() => {
				if (isPreview) {
					setPreviewExpanded(isPreview);
				}
			}}
		>
			{canPreview && !isPreview && (
				<Button
					minimal
					small
					className="collapse-button"
					icon={
						<Icon
							icon="collapse-all"
							iconSize={12}
							color={communityData.accentColorDark}
						/>
					}
					onClick={() => {
						setPreviewExpanded(false);
					}}
				/>
			)}
			<LabelList pubData={pubData} discussionData={discussionData} />
			{!isPreview && discussionData.anchor && (
				<div className="anchor-text">
					{discussionData.anchor.prefix}
					<span className="exact">{discussionData.anchor.exact}</span>
					{discussionData.anchor.suffix}
				</div>
			)}
			{!isPreview &&
				scopeData.activePermissions.canManage &&
				firebaseBranchRef &&
				loginData.id === 'b242f616-7aaa-479c-8ee5-3933dcf70859' && (
					<DiscussionReanchor
						discussionData={discussionData}
						collabData={collabData}
						firebaseBranchRef={firebaseBranchRef}
					/>
				)}
			{!isPreview && (isDiscussionAuthor || scopeData.activePermissions.canManage) && (
				<React.Fragment>
					<LabelSelect
						availableLabels={pubData.labels || []}
						labelsData={discussionData.labels || []}
						onPutDiscussion={handlePutDiscussion}
						canManagePub={scopeData.activePermissions.canManage}
						canManageThread={isDiscussionAuthor}
					/>
					<Tooltip content={discussionData.isClosed ? 'Unarchive' : 'Archive'}>
						<Button
							icon={
								<Icon
									icon={discussionData.isClosed ? 'export' : 'import'}
									iconSize={12}
								/>
							}
							minimal={true}
							small={true}
							loading={isLoadingArchive}
							alt={discussionData.isClosed ? 'Unarchive' : 'Archive'}
							onClick={() => {
								setIsLoadingArchive(true);
								handlePutDiscussion({
									isClosed: !discussionData.isClosed,
								});
							}}
						/>
					</Tooltip>
				</React.Fragment>
			)}
			{renderDiscussions()}
			{!isPreview && (canView || canCreateDiscussion) && (
				<DiscussionInput key={discussionData.thread.comments.length} {...props} />
			)}
		</div>
	);
};

Discussion.propTypes = propTypes;
Discussion.defaultProps = defaultProps;
export default Discussion;
