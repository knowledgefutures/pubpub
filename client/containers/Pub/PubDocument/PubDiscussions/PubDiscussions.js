import React, { useEffect, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { dispatchEmptyTransaction } from '@pubpub/editor';
import useWindowSize from 'react-use/lib/useWindowSize';
import { GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { PubSuspendWhileTyping } from '../../PubSuspendWhileTyping';

import ThreadGroup from './ThreadGroup';
import DiscussionThread from './DiscussionThread';
import DiscussionFilterBar from './DiscussionFilterBar';
import DiscussionInput from './DiscussionThread/DiscussionInput';
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
	const {
		collabData,
		pubData,
		firebaseBranchRef,
		updateLocalData,
		mainContentRef,
		sideContentRef,
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

			{/* Side Discussions */}
			{groupsByLine.map((group) => {
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
			})}

			{/* Bottom Discussions */}
			<GridWrapper containerClassName="pub discussion-list">
				<h2>Discussions</h2>
				<PubSuspendWhileTyping delay={1000}>
					{() => (
						<React.Fragment>
							{pubData.canDiscussBranch && (
								<DiscussionInput
									pubData={pubData}
									collabData={collabData}
									updateLocalData={updateLocalData}
									threadData={[{ id: undefined }]}
									isPubBottomInput={true}
								/>
							)}
							<DiscussionFilterBar
								pubData={pubData}
								communityData={communityData}
								threadData={threads}
								updateLocalData={updateLocalData}
							>
								{(filteredThreads) => {
									return (
										<React.Fragment>
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
								}}
							</DiscussionFilterBar>
						</React.Fragment>
					)}
				</PubSuspendWhileTyping>
			</GridWrapper>
		</div>
	);
};

PubDiscussions.propTypes = propTypes;
PubDiscussions.defaultProps = defaultProps;
export default PubDiscussions;
