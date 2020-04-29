import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Color from 'color';
import { Button, Popover, Menu, MenuItem } from '@blueprintjs/core';

import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';

import DiscussionBubble from './DiscussionBubble';

require('./discussionNav.scss');

const propTypes = {
	discussions: PropTypes.array.isRequired,
	activeThreadHover: PropTypes.string,
	setActiveThreadHover: PropTypes.func.isRequired,
	activeThread: PropTypes.string,
	setActiveThread: PropTypes.func.isRequired,
	isExpanded: PropTypes.bool.isRequired,
	setExpanded: PropTypes.func.isRequired,
};

const defaultProps = {
	activeThreadHover: undefined,
	activeThread: undefined,
};

const getLabelForDiscussion = (discussion) =>
	discussion.thread.comments
		.map((comment) => comment.author.fullName)
		.filter((name, index, array) => array.indexOf(name) === index)
		.join(', ');

const makeBubbleRenderer = ({
	discussions,
	loginData,
	communityData,
	activeThreadHover,
	activeThread,
	getHandlersForDiscussion,
}) => (discussion) => {
	const isActive = activeThreadHover === discussion.id || activeThread === discussion.id;
	const hasWrittenInThread = discussion.thread.comments.some(
		(threadComment) => threadComment.userId === loginData.id,
	);
	const bubbleCount = discussion.number && discussion.thread.comments.length;
	const label = discussion.number && getLabelForDiscussion(discussions[0]);
	return (
		<DiscussionBubble
			{...getHandlersForDiscussion(discussion)}
			key={discussion.id}
			color={communityData.accentColorDark}
			count={bubbleCount}
			isActive={isActive}
			label={label}
			showDot={hasWrittenInThread}
		/>
	);
};

const DiscussionNav = (props) => {
	const {
		discussions,
		activeThreadHover,
		activeThread,
		setActiveThread,
		setActiveThreadHover,
		isExpanded,
		setExpanded,
	} = props;

	const { communityData, loginData } = usePageContext();
	const [isOverflowHovered, setOverflowHovered] = useState(false);
	const [isOverflowShown, setOverflowShown] = useState(false);

	const accentStyle = {
		color: communityData.accentColorDark,
		borderBottom: activeThread
			? `1px solid ${communityData.accentColorDark}`
			: '1px solid transparent',
	};

	const fadedAccentColorDark = Color(communityData.accentColorDark)
		.fade(0.5)
		.rgb()
		.string();

	const getHandlersForDiscussion = (discussion) => ({
		onMouseEnter: () => {
			setActiveThreadHover(discussion.id);
		},
		onMouseLeave: () => {
			setActiveThreadHover(undefined);
		},
		onClick: () => {
			const setId = activeThread === discussion.id ? undefined : discussion.id;
			setActiveThread(setId);
		},
	});

	const bubbleRenderer = makeBubbleRenderer({
		discussions: discussions,
		loginData: loginData,
		communityData: communityData,
		activeThreadHover: activeThreadHover,
		activeThread: activeThread,
		getHandlersForDiscussion: getHandlersForDiscussion,
	});

	const maxBubblesBeforeOverflow = 7;
	const bubbleThreads = discussions.slice(0, maxBubblesBeforeOverflow);
	const overflowThreads = discussions.slice(maxBubblesBeforeOverflow);

	return (
		<span className="discussion-nav-component" style={accentStyle}>
			<style>{`.d-${activeThreadHover}, .lh-${activeThreadHover} { background-color: rgba(0, 0, 0, 0.2) !important; }`}</style>
			<style>{`.d-${activeThread}, .lh-${activeThread} { background-color: ${fadedAccentColorDark} !important; }`}</style>
			{bubbleThreads.map(bubbleRenderer)}
			{!!overflowThreads.length && (
				<Popover
					minimal
					transitionDuration={-1}
					isOpen={isOverflowShown}
					onClose={() => setOverflowShown(false)}
					content={
						<Menu>
							{overflowThreads.map((thread, index) => (
								<MenuItem
									{...getHandlersForDiscussion(thread)}
									// eslint-disable-next-line react/no-array-index-key
									key={index}
									icon={bubbleRenderer(thread)}
									text={getLabelForDiscussion(thread)}
								/>
							))}
						</Menu>
					}
				>
					<DiscussionBubble
						isActive={
							!!isOverflowHovered ||
							!!isOverflowShown ||
							!!(
								activeThread &&
								overflowThreads.some((thread) => thread.id === activeThread.id)
							)
						}
						onMouseEnter={() => setOverflowHovered(true)}
						onMouseLeave={() => setOverflowHovered(false)}
						onClick={() => setOverflowShown(true)}
						color={communityData.accentColorDark}
						count={<Icon icon="more" iconSize={10} className="overflow-icon" />}
						showDot={overflowThreads.some((thread) =>
							thread.thread.comments.some(
								(discussion) => discussion.userId === loginData.id,
							),
						)}
					/>
				</Popover>
			)}
			{activeThread && discussions.length > 1 && (
				<React.Fragment>
					<Button
						minimal={true}
						small={true}
						className="caret-button"
						icon={<Icon icon="caret-left" color={communityData.accentColorDark} />}
						onClick={() => {
							const currIndex = discussions.reduce((prev, curr, index) => {
								if (activeThread === curr.id) {
									return index;
								}
								return prev;
							}, 0);
							const leftId =
								discussions[
									(discussions.length + currIndex - 1) % discussions.length
								].id;
							setActiveThread(leftId);
						}}
					/>
					<Button
						minimal={true}
						small={true}
						className="caret-button"
						icon={<Icon icon="caret-right" color={communityData.accentColorDark} />}
						onClick={() => {
							const currIndex = discussions.reduce((prev, curr, index) => {
								if (activeThread === curr.id) {
									return index;
								}
								return prev;
							}, 0);
							const leftId =
								discussions[
									(discussions.length + currIndex + 1) % discussions.length
								].id;
							setActiveThread(leftId);
						}}
					/>
				</React.Fragment>
			)}
			{activeThread && (
				<div className="close-wrapper">
					<Button
						className="expand-button"
						minimal={true}
						small={true}
						icon={
							<Icon
								className="expand-icon"
								icon={isExpanded ? 'collapse-all' : 'expand-all'}
								iconSize={12}
								color={communityData.accentColorDark}
							/>
						}
						onClick={() => {
							setExpanded(!isExpanded);
						}}
					/>

					<Button
						minimal={true}
						small={true}
						icon={<Icon icon="small-cross" color={communityData.accentColorDark} />}
						onClick={() => {
							setActiveThread(undefined);
						}}
					/>
				</div>
			)}
		</span>
	);
};

DiscussionNav.propTypes = propTypes;
DiscussionNav.defaultProps = defaultProps;
export default DiscussionNav;
