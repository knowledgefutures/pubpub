import React, { useEffect, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { dispatchEmptyTransaction } from '@pubpub/editor';
import useWindowSize from 'react-use/lib/useWindowSize';
import { PageContext } from 'components/PageWrapper/PageWrapper';

import { NonIdealState } from '@blueprintjs/core';
import ThreadGroup from './ThreadGroup';
import DiscussionThread from './DiscussionThread';
import DiscussionInput from './DiscussionThread/DiscussionInput';
import { groupThreadsByLine, nestDiscussionsToThreads } from './discussionUtils';

require('./pubDiscussions.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	filterThreads: PropTypes.func,
	updateLocalData: PropTypes.func.isRequired,
	sideContentRef: PropTypes.object.isRequired,
	mainContentRef: PropTypes.object.isRequired,
	showBottomInput: PropTypes.bool.isRequired,
};

const defaultProps = {
	firebaseBranchRef: undefined,
	filterThreads: () => [],
};

const PubDiscussions = (props) => {
	const {
		collabData,
		pubData,
		firebaseBranchRef,
		filterThreads,
		updateLocalData,
		mainContentRef,
		sideContentRef,
		showBottomInput,
	} = props;
	const { communityData } = useContext(PageContext);
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
	const threads = nestDiscussionsToThreads(pubData.discussions);
	const groupsByLine = groupThreadsByLine(decorations, threads);
	const prevNewDiscussionIds = useRef([]);
	const prevConvertedDiscussionIds = useRef([]);

	const renderSideDiscussions = () => {
		return groupsByLine.map((group) => {
			const mountElement = document.getElementsByClassName(group.mountClassName)[0];
			if (!mountElement) {
				return null;
			}
			// console.log('about to render portal');
			// console.log('mountElement', mountElement);
			// console.log(group)
			return ReactDOM.createPortal(
				<ThreadGroup
					key={group.mountClassName}
					pubData={pubData}
					collabData={collabData}
					firebaseBranchRef={firebaseBranchRef}
					threads={group.threads}
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
		const filteredThreads = filterThreads(threads);
		const emptyMessage =
			threads.filter(
				(th) => th[0] && th[0].branchId === pubData.activeBranch.id && !th[0].isArchived,
			).length > 0
				? 'No matching comments (some are hidden by filters)'
				: pubData.canDiscuss
				? ' Why not start the discussion?'
				: '';
		return (
			<React.Fragment>
				{showBottomInput && (
					<DiscussionInput
						pubData={pubData}
						collabData={collabData}
						updateLocalData={updateLocalData}
						threadData={[{ id: undefined }]}
						isPubBottomInput={true}
					/>
				)}
				{filteredThreads.length === 0 && (
					<NonIdealState
						className="empty-state"
						icon="comment"
						title="No comments here"
						description={emptyMessage}
					/>
				)}
				{filteredThreads.map((thread) => {
					return (
						<DiscussionThread
							key={thread[0].id}
							pubData={pubData}
							collabData={collabData}
							firebaseBranchRef={firebaseBranchRef}
							threadData={thread}
							updateLocalData={updateLocalData}
							canPreview={true}
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
