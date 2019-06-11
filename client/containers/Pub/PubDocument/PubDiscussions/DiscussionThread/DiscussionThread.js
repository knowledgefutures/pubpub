import React from 'react';
import PropTypes from 'prop-types';
import DiscussionItem from './DiscussionItem';
import DiscussionInput from './DiscussionInput';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	threadData: PropTypes.array.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	setActiveThread: PropTypes.func.isRequired,
};


const DiscussionThread = (props) => {
	const { threadData } = props;
	return (
		<div className="discussion-thread" tabIndex={-1}>
			{threadData
				.filter((item) => item.threadNumber)
				.map((item) => {
					return <DiscussionItem key={item.id} discussionData={item} {...props} />;
				})}
			<DiscussionInput key={threadData.length} {...props} />
		</div>
	);
};

DiscussionThread.propTypes = propTypes;
export default DiscussionThread;
