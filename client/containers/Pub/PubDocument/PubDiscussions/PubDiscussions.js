import React, { useReducer, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { dispatchEmptyTransaction } from '@pubpub/editor';
import useWindowSize from 'react-use/lib/useWindowSize';
import DiscussionThread from './DiscussionThread';
import SidePreviews from './SidePreviews';
import {
	getDiscussionIdArray,
	getNewDiscussionIdArray,
	groupDiscussionsByTop,
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
	const discussionIds = getDiscussionIdArray(decorations);
	const newDiscussionIds = getNewDiscussionIdArray(decorations);

	const [groupTops, setGroupTops] = useState([]);

	useEffect(() => {
		const newGroupTops = groupDiscussionsByTop(decorations);

		const getCompareKey = (groupTopsArray) => {
			return groupTopsArray.reduce((prev, curr) => {
				return `${prev}${curr.key}${curr.ids.join()}`;
			}, '');
		};
		if (getCompareKey(groupTops) !== getCompareKey(newGroupTops)) {
			setGroupTops(newGroupTops);
		}
	}, [windowWidth, decorations, collabData.editorChangeObject, groupTops, discussionsState]);

	const threads = nestDiscussionsToThreads(pubData.discussions);
	if (!props.firebaseBranchRef) {
		return null;
	}

	// TODO:
	// I think what we do instead is have prosemirror include a mount point for a line-grouped
	// set of discussions. When that exists, we mount into it and don't mount the other buttons
	// Nope. We simply mount into one of existing dm- points on that line, and control it from there.
	// It'd be nice if we didn't render the button at all when there were multiple.

	// You want to calculate all the ones that are the same - and then look to see if there is
	// a following one within 100. If there are multipe - collapse. If there is one within 100, collapse
	// If there is only one, and none within a hundred - show full.
	const threadIds = [
		...discussionIds.map((id) => ({ id: id, type: 'dm' })),
		...newDiscussionIds.map((id) => ({ id: id, type: 'lm' })),
	];
	return (
		<div className="pub-discussions-component">
			{threadIds.map(({ id, type }) => {
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
			})}

			{groupTops.map((group) => {
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
			})}
		</div>
	);
};

PubDiscussions.propTypes = propTypes;
PubDiscussions.defaultProps = defaultProps;
export default PubDiscussions;
