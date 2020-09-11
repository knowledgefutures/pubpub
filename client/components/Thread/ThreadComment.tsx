import React from 'react';
import TimeAgo from 'react-timeago';

import { Avatar } from 'components';
import { timeAgoBaseProps } from 'utils/dates';
import Editor from 'components/Editor';

require('./threadComment.scss');

type Props = {
	commentData: any;
};

const ThreadComment = (props: Props) => {
	const { commentData } = props;
	const { author, content, createdAt } = commentData;

	/* The classname thread-comment2 can have the number removed once */
	/* Discussions/ThreadComment is deprecated */
	return (
		<div className="thread-comment2-component">
			<div className="header">
				<Avatar width={30} initials={author.initials} avatar={author.avatar} />
				<div className="comment-title">
					<a className="hoverline" href={`/user/${author.slug}`}>
						{author.fullName}
					</a>{' '}
					said <TimeAgo {...timeAgoBaseProps} date={createdAt} />
				</div>
			</div>
			<div className="content">
				<Editor initialContent={content} isReadOnly={true} />
			</div>
		</div>
	);
};
export default ThreadComment;
