import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { dispatchEmptyTransaction } from '@pubpub/editor';
import useWindowSize from 'react-use/lib/useWindowSize';
import ThreadGroup from './ThreadGroup';
import { groupThreadsByTop, nestDiscussionsToThreads } from './discussionUtils';

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

	useEffect(() => {
		/* Need to dispatch an empty transaction so */
		/* boundingBoxes of ranges are recalculated */
		if (collabData.editorChangeObject.view) {
			dispatchEmptyTransaction(collabData.editorChangeObject.view);
		}
		/* eslint-disable-next-line react-hooks/exhaustive-deps */
	}, []);

	const { width: windowWidth } = useWindowSize();

	const [groupTops, setGroupTops] = useState([]);

	const threads = nestDiscussionsToThreads(pubData.discussions);

	useEffect(() => {
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
	}, [windowWidth, decorations, collabData.editorChangeObject, groupTops, threads]);

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
		</div>
	);
};

PubDiscussions.propTypes = propTypes;
PubDiscussions.defaultProps = defaultProps;
export default PubDiscussions;

// const truncateText = (text) => {
// 	const previewLimit = 45;
// 	return text.length > previewLimit ? `${text.substring(0, previewLimit - 3)}...` : text;
// };
