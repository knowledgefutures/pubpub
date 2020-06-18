import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';

import { Icon } from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';

import { discussionMatchesSearchTerm } from '../discussionUtils';
import DiscussionInput from './DiscussionInput';
import LabelList from './LabelList';
import ManageTools from './ManageTools';
import ThreadComment from './ThreadComment';

require('./discussion.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	discussionData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	canPreview: PropTypes.bool,
	searchTerm: PropTypes.string,
};

const defaultProps = {
	canPreview: false,
	searchTerm: null,
};

const Discussion = (props) => {
	const { pubData, discussionData, canPreview, searchTerm, updateLocalData } = props;
	const { communityData, scopeData, locationData, loginData } = usePageContext();
	const { canView, canCreateDiscussions, canAdmin } = scopeData.activePermissions;
	const [previewExpanded, setPreviewExpanded] = useState(false);
	const isPreview = canPreview && !previewExpanded;
	const canReply = canView || canCreateDiscussions;
	const isDiscussionAuthor = loginData.id === discussionData.userId;
	const showManageTools = canAdmin || (isDiscussionAuthor && !discussionData.isClosed);

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
						discussionData={discussionData}
						isPreview={isPreviewDiscussion}
						updateLocalData={updateLocalData}
						threadCommentData={threadComment}
						pubData={pubData}
					/>,
				);
			} else {
				++pendingHiddenCount;
			}
		});

		flushPendingCount('root');
		return elements;
	};

	const handleUpdateDiscussion = (discussionUpdates) => {
		return apiFetch('/api/discussions', {
			method: 'PUT',
			body: JSON.stringify({
				...discussionUpdates,
				accessHash: locationData.query.access,
				discussionId: discussionData.id,
				pubId: pubData.id,
				branchId: pubData.activeBranch.id,
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

	const renderAnchorText = () => {
		const { anchor } = discussionData;
		if (anchor) {
			const { prefix, suffix, exact } = anchor;
			return (
				<div className="anchor-text">
					{prefix}
					<span className="exact">{exact}</span>
					{suffix}
				</div>
			);
		}
		return null;
	};

	const renderDiscussions = () => {
		const filteredThreadComments = discussionData.thread.comments;
		if (isPreview) {
			return renderPreviewDiscussionsAndOverflow(filteredThreadComments, 2);
		}
		return filteredThreadComments.map((item) => {
			return (
				<ThreadComment
					key={item.id}
					discussionData={discussionData}
					updateLocalData={updateLocalData}
					threadCommentData={item}
					isPreview={isPreview}
					pubData={pubData}
				/>
			);
		});
	};

	const renderInput = () => {
		if (!canReply) {
			return null;
		}
		return (
			<DiscussionInput
				key={discussionData.thread.comments.length}
				pubData={pubData}
				updateLocalData={updateLocalData}
				discussionData={discussionData}
			/>
		);
	};

	return (
		<div
			tabIndex={-1}
			role="button"
			className={classNames(
				'discussion-component',
				isPreview && 'preview',
				previewExpanded && 'expanded-preview',
				showManageTools && 'has-manage-tools',
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
					onClick={() => setPreviewExpanded(false)}
					icon={
						<Icon
							icon="collapse-all"
							iconSize={12}
							color={communityData.accentColorDark}
						/>
					}
				/>
			)}
			<LabelList pubData={pubData} discussionData={discussionData} />
			{!isPreview && (
				<>
					{showManageTools && (
						<ManageTools
							pubData={pubData}
							discussionData={discussionData}
							onUpdateDiscussion={handleUpdateDiscussion}
						/>
					)}
					{renderAnchorText()}
				</>
			)}
			{renderDiscussions()}
			{!isPreview && renderInput()}
		</div>
	);
};

Discussion.propTypes = propTypes;
Discussion.defaultProps = defaultProps;
export default Discussion;
