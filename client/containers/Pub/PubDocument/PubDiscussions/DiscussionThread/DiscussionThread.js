import React from 'react';
import PropTypes from 'prop-types';
import DiscussionItem from './DiscussionItem';
import DiscussionInput from './DiscussionInput';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	// discussionId: PropTypes.string.isRequired,
	// discussionState: PropTypes.object.isRequired,
	// dispatch: PropTypes.func.isRequired,
	threadData: PropTypes.array.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	setActiveThread: PropTypes.func.isRequired,
};

// const defaultProps = {
// 	threadData: [],
// };

const DiscussionThread = (props) => {
	// const { discussionState, threadData } = props;
	const { threadData } = props;
	// const { isOpen } = discussionState;
	// const isNewThread = !threadData[0].threadNumber;

	// if (!isNewThread && !isOpen) {
	// 	return null;
	// }

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
// DiscussionThread.defaultProps = defaultProps;
export default DiscussionThread;
