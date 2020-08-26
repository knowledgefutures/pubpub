import React from 'react';
import ThreadComment from './ThreadComment';
import ThreadEvent from './ThreadEvent';

require('./thread.scss');

type Props = {
	threadData: any;
};

const Thread = (props: Props) => {
	const { threadData } = props;
	const items = [...threadData.comments, ...threadData.events];
	return (
		<div className="thread-component clearfix">
			{items
				.sort((foo, bar) => {
					if (foo.createdAt > bar.createdAt) {
						return 1;
					}
					if (foo.createdAt < bar.createdAt) {
						return -1;
					}
					return 0;
				})
				.filter((item) => {
					return !(item.data && item.data.statusChange === 'created');
				})
				.map((item) => {
					if (item.content) {
						return <ThreadComment key={item.id} commentData={item} />;
					}
					return <ThreadEvent key={item.id} eventData={item} />;
				})}
		</div>
	);
};
export default Thread;
