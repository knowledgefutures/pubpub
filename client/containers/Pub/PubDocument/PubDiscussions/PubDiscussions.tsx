import React, { useEffect, useRef } from 'react';
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

type OwnProps = {
	filterDiscussions?: (...args: any[]) => any;
	mainContentRef: any;
	pubData: any;
	searchTerm?: string;
	showBottomInput?: boolean;
	sideContentRef: any;
};

const defaultProps = {
	filterDiscussions: () => [],
	searchTerm: null,
	showBottomInput: false,
};

type Props = OwnProps & typeof defaultProps;

const PubDiscussions = (props: Props) => {
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
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'decorations' does not exist on type '{}'... Remove this comment to see the full error message
	const decorations = collabData.editorChangeObject.decorations || [];
	const groupsByLine = groupDiscussionsByLine(decorations, discussions);

	useEffect(() => {
		// This effect will cause boundingBoxes to recalculate on window resize.
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
		if (collabData.editorChangeObject.view) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
			dispatchEmptyTransaction(collabData.editorChangeObject.view);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [windowWidth]);

	const renderSideDiscussions = () => {
		return groupsByLine.map((group) => {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'mountClassName' does not exist on type '... Remove this comment to see the full error message
			const mountElement = document.getElementsByClassName(group.mountClassName)[0];
			if (!mountElement) {
				return null;
			}
			return ReactDOM.createPortal(
				<DiscussionGroup
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'mountClassName' does not exist on type '... Remove this comment to see the full error message
					key={group.mountClassName}
					pubData={pubData}
					historyData={historyData}
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'discussions' does not exist on type 'nev... Remove this comment to see the full error message
					discussions={group.discussions}
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'mountClassName' does not exist on type '... Remove this comment to see the full error message
					mountClassName={group.mountClassName}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type '(...args: a... Remove this comment to see the full error message
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
		// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
		const filteredDiscussions = filterDiscussions(discussions);
		const emptyMessage =
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'filter' does not exist on type 'never'.
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
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type '(...args: a... Remove this comment to see the full error message
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
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							key={discussion.id}
							pubData={pubData}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							discussionData={discussion}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'never'.
							updateLocalData={updateLocalData}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'true' is not assignable to type 'never'.
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
PubDiscussions.defaultProps = defaultProps;
export default PubDiscussions;
