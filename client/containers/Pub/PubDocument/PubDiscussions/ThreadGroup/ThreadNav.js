import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Color from 'color';
import { Button } from '@blueprintjs/core';
import { Icon } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';

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

const ThreadNav = (props) => {
	const {
		threads,
		activeThreadHover,
		setActiveThreadHover,
		activeThread,
		setActiveThread,
		isExpanded,
		setExpanded,
	} = props;
	const { communityData, loginData } = useContext(PageContext);

	const accentStyle = {
		color: communityData.accentColorDark,
		borderBottom: activeThread
			? `1px solid ${communityData.accentColorDark}`
			: '1px solid transparent',
	};
	const accentStyleBubble = {
		border: `1px solid ${communityData.accentColorDark}`,
	};
	const accentStyleBubbleActive = {
		border: `1px solid ${communityData.accentColorDark}`,
		background: communityData.accentColorDark,
		color: 'white',
	};
	const fadedAccentColorDark = Color(communityData.accentColorDark)
		.fade(0.5)
		.rgb()
		.string();
	return (
		<span className="thread-nav-component" style={accentStyle}>
			<style>{`.d-${activeThreadHover}, .lh-${activeThreadHover} { background-color: rgba(0, 0, 0, 0.2) !important; }`}</style>
			<style>{`.d-${activeThread}, .lh-${activeThread} { background-color: ${fadedAccentColorDark} !important; }`}</style>
			{threads.map((thread) => {
				const isActive =
					activeThreadHover === thread[0].id || activeThread === thread[0].id;
				const hasWrittenInThread = thread.find((discussion) => {
					return discussion.userId === loginData.id;
				});
				const bubbleCount = thread[0].threadNumber ? (
					thread.length
				) : (
					<Icon icon="dot" color={isActive ? 'white' : communityData.accentColorDark} />
				);
				const bubbleStyle = isActive ? accentStyleBubbleActive : accentStyleBubble;
				return (
					<span
						key={thread[0].id}
						className="bubble-wrapper"
						role="button"
						tabIndex={0}
						onMouseEnter={() => {
							setActiveThreadHover(thread[0].id);
						}}
						onMouseLeave={() => {
							setActiveThreadHover(undefined);
						}}
						onClick={() => {
							const setId = activeThread === thread[0].id ? undefined : thread[0].id;
							setActiveThread(setId);
						}}
					>
						<span className="bubble" style={bubbleStyle}>
							{bubbleCount}
							{hasWrittenInThread && (
								<span
									className="bubble-dot"
									style={{ border: `1px solid ${communityData.accentColorDark}` }}
								/>
							)}
						</span>
						{threads.length === 1 && thread[0].threadNumber && (
							<span className="names">
								{threads[0]
									.map((discussion) => {
										return discussion.author.fullName;
									})
									.filter((name, index, array) => {
										return array.indexOf(name) === index;
									})
									.join(', ')}
							</span>
						)}
					</span>
				);
			})}
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
