import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import Color from 'color';
import { Button, Popover, Menu, MenuItem } from '@blueprintjs/core';

import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';

import ThreadBubble from './ThreadBubble';

require('./threadNav.scss');

const propTypes = {
	threads: PropTypes.array.isRequired,
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

const getLabelForThread = (thread) =>
	thread
		.map((discussion) => discussion.author.fullName)
		.filter((name, index, array) => array.indexOf(name) === index)
		.join(', ');

const makeBubbleRenderer = ({
	threads,
	loginData,
	communityData,
	activeThreadHover,
	activeThread,
	getHandlersForThread,
}) => (thread) => {
	const isActive = activeThreadHover === thread[0].id || activeThread === thread[0].id;
	const hasWrittenInThread = thread.some((discussion) => discussion.userId === loginData.id);
	const bubbleCount = thread[0].threadNumber && thread.length;
	const label = threads.length === 1 && thread[0].threadNumber && getLabelForThread(threads[0]);
	return (
		<ThreadBubble
			{...getHandlersForThread(thread)}
			key={thread[0].id}
			color={communityData.accentColorDark}
			count={bubbleCount}
			isActive={isActive}
			label={label}
			showDot={hasWrittenInThread}
		/>
	);
};

const ThreadNav = (props) => {
	const {
		threads,
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

	const getHandlersForThread = (thread) => ({
		onMouseEnter: () => {
			setActiveThreadHover(thread[0].id);
		},
		onMouseLeave: () => {
			setActiveThreadHover(undefined);
		},
		onClick: () => {
			const setId = activeThread === thread[0].id ? undefined : thread[0].id;
			setActiveThread(setId);
		},
	});

	const bubbleRenderer = makeBubbleRenderer({
		threads: threads,
		loginData: loginData,
		communityData: communityData,
		activeThreadHover: activeThreadHover,
		activeThread: activeThread,
		getHandlersForThread: getHandlersForThread,
	});

	const maxBubblesBeforeOverflow = 7;
	const bubbleThreads = threads.slice(0, maxBubblesBeforeOverflow);
	const overflowThreads = threads.slice(maxBubblesBeforeOverflow);

	return (
		<span className="thread-nav-component" style={accentStyle}>
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
									{...getHandlersForThread(thread)}
									// eslint-disable-next-line react/no-array-index-key
									key={index}
									icon={bubbleRenderer(thread)}
									text={getLabelForThread(thread)}
								/>
							))}
						</Menu>
					}
				>
					<ThreadBubble
						isActive={
							isOverflowHovered ||
							isOverflowShown ||
							(activeThread &&
								overflowThreads.some((thread) => thread.id === activeThread.id))
						}
						onMouseEnter={() => setOverflowHovered(true)}
						onMouseLeave={() => setOverflowHovered(false)}
						onClick={() => setOverflowShown(true)}
						color={communityData.accentColorDark}
						count={<Icon icon="more" iconSize={10} className="overflow-icon" />}
						showDot={overflowThreads.some((thread) =>
							thread.some((discussion) => discussion.userId === loginData.id),
						)}
					/>
				</Popover>
			)}
			{activeThread && threads.length > 1 && (
				<React.Fragment>
					<Button
						minimal={true}
						small={true}
						className="caret-button"
						icon={<Icon icon="caret-left" color={communityData.accentColorDark} />}
						onClick={() => {
							const currIndex = threads.reduce((prev, curr, index) => {
								if (activeThread === curr[0].id) {
									return index;
								}
								return prev;
							}, 0);
							const leftId =
								threads[(threads.length + currIndex - 1) % threads.length][0].id;
							setActiveThread(leftId);
						}}
					/>
					<Button
						minimal={true}
						small={true}
						className="caret-button"
						icon={<Icon icon="caret-right" color={communityData.accentColorDark} />}
						onClick={() => {
							const currIndex = threads.reduce((prev, curr, index) => {
								if (activeThread === curr[0].id) {
									return index;
								}
								return prev;
							}, 0);
							const leftId =
								threads[(threads.length + currIndex + 1) % threads.length][0].id;
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

ThreadNav.propTypes = propTypes;
ThreadNav.defaultProps = defaultProps;
export default ThreadNav;
