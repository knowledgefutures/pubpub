import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
import { Icon } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import DiscussionItem from './DiscussionItem';
import DiscussionInput from './DiscussionInput';

require('./discussionThread.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	threadData: PropTypes.array.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	setActiveThread: PropTypes.func,
	canPreview: PropTypes.bool,
};

const defaultProps = {
	canPreview: false,
	setActiveThread: () => {},
};

const DiscussionThread = (props) => {
	const { pubData, threadData, canPreview } = props;
	const { communityData } = useContext(PageContext);
	const [previewExpanded, setPreviewExpanded] = useState(false);
	const isPreview = canPreview && !previewExpanded;
	return (
		<div
			className={classNames(
				'discussion-thread-component',
				isPreview && 'preview',
				previewExpanded && 'expanded-preview',
			)}
			tabIndex={-1}
			onClick={() => {
				if (isPreview) {
					setPreviewExpanded(true);
				}
			}}
			role="button"
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
			{threadData
				.filter((item) => item.threadNumber)
				.filter((item, index) => {
					return !isPreview || index < 2;
				})
				.map((item, index) => {
					return (
						<DiscussionItem
							key={item.id}
							discussionData={item}
							isPreview={isPreview}
							isRootThread={index === 0}
							{...props}
						/>
					);
				})}
			{isPreview && threadData.length > 2 && <span> + {threadData.length - 2} more...</span>}
			{!isPreview && pubData.canDiscussBranch && (
				<DiscussionInput key={threadData.length} {...props} />
			)}
		</div>
	);
};

DiscussionThread.propTypes = propTypes;
DiscussionThread.defaultProps = defaultProps;
export default DiscussionThread;
