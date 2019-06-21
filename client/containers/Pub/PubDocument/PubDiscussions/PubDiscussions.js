import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { dispatchEmptyTransaction } from '@pubpub/editor';
import useWindowSize from 'react-use/lib/useWindowSize';
import ThreadGroup from './ThreadGroup';
import { groupThreadsByLine, nestDiscussionsToThreads } from './discussionUtils';

require('./pubDiscussions.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	updateLocalData: PropTypes.func.isRequired,
	sideContentRef: PropTypes.object.isRequired,
	mainContentRef: PropTypes.object.isRequired,
};

const defaultProps = {
	firebaseBranchRef: undefined,
};

const PubDiscussions = (props) => {
	const { pubData, collabData, firebaseBranchRef, mainContentRef, sideContentRef } = props;
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

	if (!props.firebaseBranchRef) {
		return null;
	}
	return (
		<div className="pub-discussions-component">
			{groupsByLine.map((group) => {
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
						mountClassName={group.mountClassName}
						updateLocalData={props.updateLocalData}
						sideContentRef={sideContentRef}
						mainContentRef={mainContentRef}
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
