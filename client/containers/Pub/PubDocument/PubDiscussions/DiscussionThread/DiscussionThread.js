import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';
import DiscussionItem from './DiscussionItem';
import DiscussionInput from './DiscussionInput';
import LabelList from './LabelList';
import { discussionMatchesSearchTerm } from '../discussionUtils';

require('./discussionThread.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	threadData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	canPreview: PropTypes.bool,
	searchTerm: PropTypes.string,
};

const defaultProps = {
	firebaseBranchRef: undefined,
	canPreview: false,
	searchTerm: null,
};

const DiscussionThread = (props) => {
	const { pubData, threadData, canPreview, searchTerm } = props;
	const { communityData } = usePageContext();
	const [previewExpanded, setPreviewExpanded] = useState(false);
	const isPreview = canPreview && !previewExpanded;

	const renderPreviewDiscussionsAndOverflow = (discussions, minShown) => {
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

		discussions.forEach((discussion, index) => {
			const isRootThread = index === 0;
			const meetsMinimum = shownDiscussionsCount < minShown;
			const matchesSearch = discussionMatchesSearchTerm(discussion, searchTerm);
			const isPreviewDiscussion = isRootThread || !matchesSearch;
			if (isRootThread || meetsMinimum || matchesSearch) {
				++shownDiscussionsCount;
				flushPendingCount(discussion.id);
				elements.push(
					<DiscussionItem
						key={discussion.id}
						discussionData={discussion}
						isPreview={isPreviewDiscussion}
						isRootThread={isRootThread}
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
		const filteredDiscussions = threadData.comments;
		if (isPreview) {
			return renderPreviewDiscussionsAndOverflow(filteredDiscussions, 2);
		}
		return filteredDiscussions.map((item, index) => {
			return (
				<DiscussionItem
					key={item.id}
					discussionData={item}
					isPreview={isPreview}
					isRootThread={index === 0}
					{...props}
				/>
			);
		});
	};

	return (
		<div
			tabIndex={-1}
			role="button"
			className={classNames(
				'discussion-thread-component',
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
			<LabelList pubData={pubData} threadData={threadData} />

			{!isPreview && threadData.threadAnchor && (
				<div className="anchor-text">
					{threadData.threadAnchor.prefix}
					<span className="exact">{threadData.threadAnchor.exact}</span>
					{threadData.threadAnchor.suffix}
				</div>
			)}
			{renderDiscussions()}
			{!isPreview && pubData.canDiscussBranch && (
				<DiscussionInput key={threadData.comments.length} {...props} />
			)}
		</div>
	);
};

DiscussionThread.propTypes = propTypes;
DiscussionThread.defaultProps = defaultProps;
export default DiscussionThread;
