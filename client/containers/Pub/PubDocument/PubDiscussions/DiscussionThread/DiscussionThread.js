import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
import { Icon } from 'components';
import { PageContext } from 'utils/hooks';
import DiscussionItem from './DiscussionItem';
import DiscussionInput from './DiscussionInput';
import LabelList from './LabelList';
import { discussionMatchesSearchTerm } from '../discussionUtils';

require('./discussionThread.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	threadData: PropTypes.array.isRequired,
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
	const { communityData } = useContext(PageContext);
	const [previewExpanded, setPreviewExpanded] = useState(false);
	const isPreview = canPreview && !previewExpanded;

	const renderPreviewDiscussionsAndOverflow = (discussions, minShown) => {
		let shownDiscussionsCount = 0;
		let pendingHiddenCount = 0;
		const elements = [];

		const flushPendingCount = () => {
			if (pendingHiddenCount > 0) {
				elements.push(
					<div className="overflow-listing"> + {pendingHiddenCount} more...</div>,
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
				flushPendingCount();
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

		flushPendingCount();
		return elements;
	};

	const renderDiscussions = () => {
		const filteredDiscussions = threadData.filter((discussion) => discussion.threadNumber);
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
			{!isPreview && threadData[0].initAnchorText && threadData[0].initAnchorText.exact && (
				<div className="anchor-text">
					{threadData[0].initAnchorText.prefix}
					<span className="exact">{threadData[0].initAnchorText.exact}</span>
					{threadData[0].initAnchorText.suffix}
				</div>
			)}
			{renderDiscussions()}
			{!isPreview && pubData.canDiscussBranch && (
				<DiscussionInput key={threadData.length} {...props} />
			)}
		</div>
	);
};

DiscussionThread.propTypes = propTypes;
DiscussionThread.defaultProps = defaultProps;
export default DiscussionThread;
