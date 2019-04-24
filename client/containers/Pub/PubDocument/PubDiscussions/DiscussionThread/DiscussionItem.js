import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import Editor from '@pubpub/editor';
import { Button, Intent } from '@blueprintjs/core';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { Avatar, Icon } from 'components';

const propTypes = {
	discussionData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const DiscussionItem = (props) => {
	const { discussionData } = props;
	const { loginData, communityData } = useContext(PageContext);

	return (
		<div className="discussion-item">
			<div className="avatar-wrapper">
				<Avatar
					width={30}
					userInitials={discussionData.author.intials}
					userAvatar={discussionData.author.avatar}
				/>
			</div>
			<div className="content-wrapper">
				<div className="item-header">
					<span className="name">{discussionData.author.fullName}</span>
					<span className="time">
						<TimeAgo
							minPeriod={60}
							formatter={(value, unit, suffix) => {
								if (unit === 'second') {
									return 'just now';
								}
								let newUnit = unit;
								if (value > 1) {
									newUnit += 's';
								}
								return `${value} ${newUnit} ${suffix}`;
							}}
							date={discussionData.createdAt}
						/>
						{discussionData.createdAt !== discussionData.updatedAt && (
							<span> (edited)</span>
						)}
					</span>
					<span className="actions">
						<Button
							icon={<Icon icon="edit2" iconSize={14} />}
							minimal={true}
							small={true}
						/>
						<Button
							icon={<Icon icon="flag" iconSize={14} />}
							minimal={true}
							small={true}
						/>
					</span>
				</div>
				<div className="discussion-body-wrapper">
					<Editor isReadOnly={true} initialContent={discussionData.content} />
				</div>
			</div>
		</div>
	);
};

DiscussionItem.propTypes = propTypes;
export default DiscussionItem;
