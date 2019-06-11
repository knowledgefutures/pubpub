import React, { useReducer, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { dispatchEmptyTransaction } from '@pubpub/editor';
import useWindowSize from 'react-use/lib/useWindowSize';
import DiscussionThread from './DiscussionThread';
import ThreadGroup from './ThreadGroup';
import SidePreviews from './SidePreviews';
import {
	getDiscussionIdArray,
	getNewDiscussionIdArray,
	// groupDiscussionsByTop,
	groupThreadsByTop,
	nestDiscussionsToThreads,
} from './discussionUtils';

require('./pubDiscussions.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	updateLocalData: PropTypes.func.isRequired,
	mainContentRef: PropTypes.object.isRequired,
	sideContentRef: PropTypes.object.isRequired,
};

const defaultProps = {
	firebaseBranchRef: undefined,
};

const PubDiscussions = (props) => {
	const { pubData, collabData, firebaseBranchRef, sideContentRef, mainContentRef } = props;
	const decorations = collabData.editorChangeObject.decorations || [];
	const [discussionsState, discussionsDispatch] = useReducer((state, action) => {
		if (action.delete) {
			const newState = { ...state };
			delete newState[action.id];
			return newState;
		}
		return {
			...state,
			[action.id]: {
				...state[action.id],
				[action.key]: action.value,
			},
		};
	}, {});

	useEffect(() => {
		/* Need to dispatch an empty transaction so */
		/* boundingBoxes of ranges are recalculated */
		if (collabData.editorChangeObject.view) {
			dispatchEmptyTransaction(collabData.editorChangeObject.view);
		}
		/* eslint-disable-next-line react-hooks/exhaustive-deps */
	}, [discussionsState]);

	const { width: windowWidth } = useWindowSize();
	// const discussionIds = getDiscussionIdArray(decorations);
	// const newDiscussionIds = getNewDiscussionIdArray(decorations);

	const [groupTops, setGroupTops] = useState([]);

	const threads = nestDiscussionsToThreads(pubData.discussions);

	useEffect(() => {
		// const newGroupTops = groupDiscussionsByTop(decorations);
		const newGroupTops = groupThreadsByTop(decorations, threads);

		const getCompareKey = (groupTopsArray) => {
			return groupTopsArray.reduce((prev, curr) => {
				const currIds = curr.threads.map((thread) => thread[0].id);
				return `${prev}${curr.key}${currIds.join()}`;
			}, '');
		};
		if (getCompareKey(groupTops) !== getCompareKey(newGroupTops)) {
			setGroupTops(newGroupTops);
		}
	}, [
		windowWidth,
		decorations,
		collabData.editorChangeObject,
		groupTops,
		discussionsState,
		threads,
	]);

	// const threadIds = [
	// 	...discussionIds.map((id) => ({ id: id, type: 'dm' })),
	// 	...newDiscussionIds.map((id) => ({ id: id, type: 'lm' })),
	// ];
	// console.log(groupTops);
	if (!props.firebaseBranchRef) {
		return null;
	}
	return (
		<div className="pub-discussions-component">
			{groupTops.map((group) => {
				const mountElement = document.getElementsByClassName(group.mountClassName)[0];
				if (!mountElement) {
					return null;
				}
				return ReactDOM.createPortal(
					<ThreadGroup
						pubData={pubData}
						collabData={collabData}
						firebaseBranchRef={firebaseBranchRef}
						threads={group.threads}
						updateLocalData={props.updateLocalData}
						mainContentRef={mainContentRef}
						sideContentRef={sideContentRef}
					/>,
					mountElement,
				);
			})}
			{/*threadIds.map(({ id, type }) => {
				const threadData = threads.find((thread) => {
					return thread[0].id === id;
				});
				if (!threadData && type === 'dm') {
					return null;
				}

				return ReactDOM.createPortal(
					<DiscussionThread
						pubData={pubData}
						collabData={collabData}
						firebaseBranchRef={firebaseBranchRef}
						discussionId={id}
						discussionState={discussionsState[id] || {}}
						dispatch={discussionsDispatch}
						threadData={threadData}
						updateLocalData={props.updateLocalData}
					/>,
					document.getElementsByClassName(`${type}-${id}`)[0],
				);
			})*/}

			{/*groupTops.map((group) => {
				return ReactDOM.createPortal(
					<ThreadGroup
						threads={threads}
						groupData={group}
						discussionsState={discussionsState}
						dispatch={discussionsDispatch}
						mainContentRef={mainContentRef}
						sideContentRef={sideContentRef}
					/>,
					document.getElementsByClassName(`dm-${group.ids[0]}`)[0],
				);
			})*/}

			{/*groupTops.map((group) => {
				return ReactDOM.createPortal(
					<SidePreviews
						threads={threads}
						groupData={group}
						discussionsState={discussionsState}
						dispatch={discussionsDispatch}
						mainContentRef={mainContentRef}
						sideContentRef={sideContentRef}
					/>,
					document.getElementsByClassName(`dm-${group.ids[0]}`)[0],
				);
			})*/}
		</div>
	);
};

PubDiscussions.propTypes = propTypes;
PubDiscussions.defaultProps = defaultProps;
export default PubDiscussions;
