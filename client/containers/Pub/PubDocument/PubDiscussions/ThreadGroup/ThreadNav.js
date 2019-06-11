import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Color from 'color';
import { Button } from '@blueprintjs/core';
import { Icon } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';

require('./threadNav.scss');

const propTypes = {
	// pubData: PropTypes.object.isRequired,
	// collabData: PropTypes.object.isRequired,
	// firebaseBranchRef: PropTypes.object.isRequired,
	threads: PropTypes.array.isRequired,
	// updateLocalData: PropTypes.func.isRequired,
	activeThreadHover: PropTypes.string,
	setActiveThreadHover: PropTypes.func.isRequired,
	activeThread: PropTypes.string,
	setActiveThread: PropTypes.func.isRequired,
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
	} = props;
	const { communityData } = useContext(PageContext);

	const accentStyle = {
		color: communityData.accentColorDark,
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
							setActiveThread(thread[0].id);
						}}
					>
						<span className="bubble" style={bubbleStyle}>
							{bubbleCount}
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
		</span>
	);
};

ThreadNav.propTypes = propTypes;
ThreadNav.defaultProps = defaultProps;
export default ThreadNav;
