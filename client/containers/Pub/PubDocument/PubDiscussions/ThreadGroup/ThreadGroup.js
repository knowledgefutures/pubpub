import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ThreadNav from './ThreadNav';
import DiscussionThread from '../DiscussionThread';
// import DiscussionInput from './DiscussionInput';

require('./threadGroup.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	threads: PropTypes.array.isRequired,
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
	} = props;
	const [activeThreadHover, setActiveThreadHover] = useState(undefined);
	const [activeThread, setActiveThread] = useState(undefined);
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

	// useEffect(() => {
	/* When a highlight is removed (i.e. a new one is Cancelled) */
	/* and was the activeThread, we need to clear */
	const activeThreadData = threads.find((thread) => {
		return thread[0].id === activeThread;
	});

	if (activeThread && !activeThreadData) {
		setActiveThread(undefined);
	}
	// }, [activeThread, threads]);

	// const { isOpen } = discussionState;
	// const isNewThread = !threadData.length;

	// if (!isNewThread && !isOpen) {
	// 	return null;
	// }
	const mainWidth = mainContentRef.current.offsetWidth;
	const sideWidth = sideContentRef.current.offsetWidth;
	const left = (mainWidth + sideWidth) / 0.96 - sideWidth;

	const style = { left: left, width: sideWidth, position: 'absolute' };
	return (
		<span className="thread-group-component" style={style} tabIndex={-1}>
			<ThreadNav
				threads={threads}
				activeThreadHover={activeThreadHover}
				setActiveThreadHover={setActiveThreadHover}
				activeThread={activeThread}
				setActiveThread={setActiveThread}
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
			{/*
				SideBubbles
				SideExpanded
				InlineExpanded
				SideClose
			*/}
		</span>
	);
};

ThreadGroup.propTypes = propTypes;
export default ThreadGroup;
