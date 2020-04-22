import React from 'react';
import PropTypes from 'prop-types';
// import { usePageContext } from 'utils/hooks';
import { Avatar } from 'components';
import TimeAgo from 'react-timeago';
import { timeAgoBaseProps } from 'utils';
import Editor from 'components/Editor';

require('./threadComment.scss');

const propTypes = {
	commentData: PropTypes.object.isRequired,
};

const ThreadComment = (props) => {
	const { author, content, createdAt } = props.commentData;

	/* The classname thread-comment2 can have the number removed once */
	/* Discussions/ThreadComment is deprecated */
	return (
		<div className="thread-comment2-component">
			<div className="header">
				<Avatar width={30} intials={author.initials} avatar={author.avatar} />
				<div className="comment-title">
					<a className="hoverline" href={`/user/${author.slug}`}>
						{author.fullName}
					</a>{' '}
					said <TimeAgo {...timeAgoBaseProps} date={createdAt} />
				</div>
				{/* <div>Options</div> */}
			</div>
			<div className="content">
				<Editor initialContent={content} isReadOnly={true} />
			</div>
		</div>
	);
};

ThreadComment.propTypes = propTypes;
export default ThreadComment;
