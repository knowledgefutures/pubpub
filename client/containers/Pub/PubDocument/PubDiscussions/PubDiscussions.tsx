import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import useWindowSize from 'react-use/lib/useWindowSize';
import { dispatchEmptyTransaction } from 'components/Editor';
import { NonIdealState } from 'components';

import { usePageContext } from 'utils/hooks';
import { PubPageData } from 'types';
import { usePubContext } from '../../pubHooks';

import DiscussionGroup from './DiscussionGroup';
import Discussion from './Discussion';
import DiscussionInput from './Discussion/DiscussionInput';
import { groupDiscussionsByLine } from './discussionUtils';

require('./pubDiscussions.scss');

type Props = {
	filterDiscussions?: (...args: any[]) => any;
	mainContentRef: any;
	pubData: PubPageData;
	searchTerm?: string;
	showBottomInput?: boolean;
	sideContentRef: any;
};

const defaultDiscussionsFilter = () => [];

const PubDiscussions = (props: Props) => {
	const {
		pubData,
		filterDiscussions = defaultDiscussionsFilter,
		mainContentRef,
		sideContentRef,
		searchTerm = null,
		showBottomInput = false,
	} = props;

	const { collabData, updateLocalData, historyData } = usePubContext();
	const { communityData, scopeData } = usePageContext();
	const { width: windowWidth } = useWindowSize();
	const prevNewDiscussionIds = useRef([]);
	const prevConvertedDiscussionIds = useRef([]);

	const { discussions } = pubData;
	const { canView, canCreateDiscussions } = scopeData.activePermissions;
	const decorations = collabData.editorChangeObject!.decorations || [];
	const groupsByLine = groupDiscussionsByLine(decorations, discussions);

	useEffect(() => {
		// This effect will cause boundingBoxes to recalculate on window resize.
		if (collabData.editorChangeObject!.view) {
			dispatchEmptyTransaction(collabData.editorChangeObject!.view);
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
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ key: any; pubData: never; historyData: {};... Remove this comment to see the full error message
					historyData={historyData}
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'discussions' does not exist on type 'nev... Remove this comment to see the full error message
					discussions={group.discussions}
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'mountClassName' does not exist on type '... Remove this comment to see the full error message
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
					<DiscussionInput discussionData={{ id: undefined }} isPubBottomInput={true} />
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
							searchTerm={searchTerm || undefined}
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

export default PubDiscussions;
