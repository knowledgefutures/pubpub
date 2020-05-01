import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import useWindowSize from 'react-use/lib/useWindowSize';
import { dispatchEmptyTransaction } from 'components/Editor';
import { NonIdealState } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { usePubContext } from '../../pubHooks';

import DiscussionGroup from './DiscussionGroup';
import Discussion from './Discussion';
import DiscussionInput from './Discussion/DiscussionInput';
import { groupDiscussionsByLine } from './discussionUtils';

require('./pubDiscussions.scss');

const propTypes = {
	filterDiscussions: PropTypes.func,
	mainContentRef: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	searchTerm: PropTypes.string,
	showBottomInput: PropTypes.bool,
	sideContentRef: PropTypes.object.isRequired,
};

const defaultProps = {
	filterDiscussions: () => [],
	searchTerm: null,
	showBottomInput: false,
};

const PubDiscussions = (props) => {
	const {
		pubData,
		filterDiscussions,
		mainContentRef,
		sideContentRef,
		searchTerm,
		showBottomInput,
	} = props;

	const { collabData, updateLocalData, historyData } = usePubContext();
	const { communityData, scopeData } = usePageContext();
	const { width: windowWidth } = useWindowSize();
	const prevNewDiscussionIds = useRef([]);
	const prevConvertedDiscussionIds = useRef([]);

	const { discussions } = pubData;
	const { canView, canCreateDiscussions } = scopeData;
	const decorations = collabData.editorChangeObject.decorations || [];
	const groupsByLine = groupDiscussionsByLine(decorations, discussions);

	useEffect(() => {
		// This effect will cause boundingBoxes to recalculate on window resize.
		if (collabData.editorChangeObject.view) {
			dispatchEmptyTransaction(collabData.editorChangeObject.view);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [windowWidth]);

	const renderSideDiscussions = () => {
		return groupsByLine.map((group) => {
			const mountElement = document.getElementsByClassName(group.mountClassName)[0];
			if (!mountElement) {
				return null;
			}
			return ReactDOM.createPortal(
				<DiscussionGroup
					key={group.mountClassName}
					pubData={pubData}
					historyData={historyData}
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
			discussions.filter((th) => th && !th.isClosed).length > 0
				? 'No matching comments (some are hidden by filters)'
				: canView || canCreateDiscussions
				? ' Why not start the discussion?'
				: '';
		return (
			<React.Fragment>
				{showBottomInput && (
					<DiscussionInput
						pubData={pubData}
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
