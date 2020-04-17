import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { dispatchEmptyTransaction } from '@pubpub/editor';
import useWindowSize from 'react-use/lib/useWindowSize';
import { usePageContext } from 'utils/hooks';

import { NonIdealState } from '@blueprintjs/core';
import DiscussionGroup from './DiscussionGroup';
import Discussion from './Discussion';
import DiscussionInput from './Discussion/DiscussionInput';
import { groupDiscussionsByLine } from './discussionUtils';

require('./pubDiscussions.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	historyData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	filterDiscussions: PropTypes.func,
	updateLocalData: PropTypes.func.isRequired,
	sideContentRef: PropTypes.object.isRequired,
	mainContentRef: PropTypes.object.isRequired,
	showBottomInput: PropTypes.bool,
	searchTerm: PropTypes.string,
};

const defaultProps = {
	firebaseBranchRef: undefined,
	filterDiscussions: () => [],
	searchTerm: null,
	showBottomInput: false,
};

const PubDiscussions = (props) => {
	const {
		collabData,
		pubData,
		firebaseBranchRef,
		filterDiscussions,
		updateLocalData,
		mainContentRef,
		sideContentRef,
		searchTerm,
		showBottomInput,
		historyData,
	} = props;
	const { communityData, scopeData } = usePageContext();
	const { canView, canCreateDiscussions } = scopeData;
	const decorations = collabData.editorChangeObject.decorations || [];
	const { width: windowWidth } = useWindowSize();

	useEffect(() => {
		/* This effect will cause boundingBoxes to */
		/* recalculate on window resize. */
		if (collabData.editorChangeObject.view) {
			dispatchEmptyTransaction(collabData.editorChangeObject.view);
		}
		/* eslint-disable-next-line react-hooks/exhaustive-deps */
	}, [windowWidth]);
	// const threads = nestDiscussionsToThreads(pubData.discussions);
	const { discussions } = pubData;
	const groupsByLine = groupDiscussionsByLine(decorations, discussions);
	const prevNewDiscussionIds = useRef([]);
	const prevConvertedDiscussionIds = useRef([]);

	const renderSideDiscussions = () => {
		// return null;
		return groupsByLine.map((group) => {
			const mountElement = document.getElementsByClassName(group.mountClassName)[0];
			if (!mountElement) {
				return null;
			}
			// console.log('about to render portal');
			// console.log('mountElement', mountElement);
			// console.log(group)
			return ReactDOM.createPortal(
				<DiscussionGroup
					key={group.mountClassName}
					pubData={pubData}
					collabData={collabData}
					historyData={historyData}
					firebaseBranchRef={firebaseBranchRef}
					discussions={group.discussions}
					mountClassName={group.mountClassName}
					updateLocalData={updateLocalData}
					sideContentRef={sideContentRef}
					mainContentRef={mainContentRef}
					prevNewDiscussionIds={prevNewDiscussionIds}
					prevConvertedDiscussionIds={prevConvertedDiscussionIds}
				/>,
				mountElement,
			);
		});
	};

	const renderBottomDiscussions = () => {
		const filteredDiscussions = filterDiscussions(discussions);
		const emptyMessage =
			discussions.filter(
				// (th) => th[0] && th[0].branchId === pubData.activeBranch.id && !th[0].isArchived,
				(th) => th && !th.isClosed,
			).length > 0
				? 'No matching comments (some are hidden by filters)'
				: canView || canCreateDiscussions
				? ' Why not start the discussion?'
				: '';
		return (
			<React.Fragment>
				{showBottomInput && (
					<DiscussionInput
						pubData={pubData}
						collabData={collabData}
						historyData={historyData}
						updateLocalData={updateLocalData}
						discussionData={{ id: undefined }}
						isPubBottomInput={true}
					/>
				)}
				{filteredDiscussions.length === 0 && (
					<NonIdealState
						className="empty-state"
						icon="comment"
						title="No comments here"
						description={emptyMessage}
					/>
				)}
				{filteredDiscussions.map((discussion) => {
					return (
						<Discussion
							key={discussion.id}
							pubData={pubData}
							collabData={collabData}
							historyData={historyData}
							firebaseBranchRef={firebaseBranchRef}
							discussionData={discussion}
							updateLocalData={updateLocalData}
							canPreview={true}
							searchTerm={searchTerm}
						/>
					);
				})}
			</React.Fragment>
		);
	};

	return (
		<div className="pub-discussions-component">
			<style>
				{`
					.discussion-list .discussion-thread-component.preview:hover,
					.discussion-list .discussion-thread-component.expanded-preview {
						border-left: 3px solid ${communityData.accentColorDark};
						padding-left: calc(1em - 2px);
					}
				`}
			</style>
			{renderSideDiscussions()}
			<div className="discussion-list">{renderBottomDiscussions()}</div>
		</div>
	);
};

PubDiscussions.propTypes = propTypes;
PubDiscussions.defaultProps = defaultProps;
export default PubDiscussions;
