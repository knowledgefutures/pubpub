import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ThreadNav from './ThreadNav';
import DiscussionThread from '../DiscussionThread';

require('./threadGroup.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	threads: PropTypes.array.isRequired,
	mountClassName: PropTypes.string.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	mainContentRef: PropTypes.object.isRequired,
	sideContentRef: PropTypes.object.isRequired,
};

const ThreadGroup = (props) => {
	const {
		pubData,
		collabData,
		firebaseBranchRef,
		updateLocalData,
		threads,
		mainContentRef,
		sideContentRef,
		mountClassName,
	} = props;
	const [activeThreadHover, setActiveThreadHover] = useState(undefined);
	const [activeThread, setActiveThread] = useState(undefined);
	const [isExpanded, setExpanded] = useState(false);
	const prevNewDiscussionIds = useRef([]);

	useEffect(() => {
		/* We want to set the activeThread to any newly created discussion */
		const justCreatedDiscussionId = threads.reduce((prev, curr) => {
			const isNewDiscussion = !curr[0].threadNumber;
			const alreadyKnowAboutNewDiscussion = prevNewDiscussionIds.current.includes(curr[0].id);
			if (isNewDiscussion && !alreadyKnowAboutNewDiscussion) {
				return curr[0].id;
			}
			return prev;
		}, undefined);
		if (justCreatedDiscussionId) {
			prevNewDiscussionIds.current.concat(justCreatedDiscussionId);
			setActiveThread(justCreatedDiscussionId);
		}
	}, [threads]);

	useEffect(() => {
		/* This effect is due to a Chrome rendering bug that causes */
		/* the text to not reflow when moving back to position: absolute */
		document.getElementsByClassName(mountClassName)[0].style.display =
			activeThread && isExpanded ? 'block' : 'inline';
	}, [mountClassName, isExpanded, activeThread]);

	/* When a highlight is removed (i.e. a new one is Cancelled) */
	/* and was the activeThread, we need to clear */
	const activeThreadData = threads.find((thread) => {
		return thread[0].id === activeThread;
	});

	if (activeThread && !activeThreadData) {
		setActiveThread(undefined);
	}

	const mainWidth = mainContentRef.current.offsetWidth;
	const sideWidth = sideContentRef.current.offsetWidth;
	const left = (mainWidth + sideWidth) / 0.96 - sideWidth;

	const style = {
		left: isExpanded && activeThread ? 0 : left,
		width: isExpanded && activeThread ? 'auto' : sideWidth,
	};
	return (
		<span
			className={classNames({
				'thread-group-component': true,
				active: activeThread,
				expanded: isExpanded && activeThread,
			})}
			style={style}
			tabIndex={-1}
		>
			<ThreadNav
				key={isExpanded && activeThread}
				threads={threads}
				activeThreadHover={activeThreadHover}
				setActiveThreadHover={setActiveThreadHover}
				activeThread={activeThread}
				setActiveThread={setActiveThread}
				isExpanded={isExpanded}
				setExpanded={setExpanded}
			/>
			{activeThread && (
				<DiscussionThread
					pubData={pubData}
					collabData={collabData}
					firebaseBranchRef={firebaseBranchRef}
					threadData={threads.find((thread) => thread[0].id === activeThread)}
					updateLocalData={updateLocalData}
					setActiveThread={setActiveThread}
				/>
			)}
		</span>
	);
};

ThreadGroup.propTypes = propTypes;
export default ThreadGroup;
