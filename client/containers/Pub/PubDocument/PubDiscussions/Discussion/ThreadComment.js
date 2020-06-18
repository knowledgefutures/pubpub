import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import classNames from 'classnames';
import { Button, Intent } from '@blueprintjs/core';

import Editor, { getText, getJSON } from 'components/Editor';
import FormattingBarLegacy from 'components/FormattingBarLegacy/FormattingBar';
import { Avatar, Icon } from 'components';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

require('./threadComment.scss');

const propTypes = {
	discussionData: PropTypes.object.isRequired,
	threadCommentData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	isPreview: PropTypes.bool,
};

const defaultProps = {
	isPreview: false,
};

const ThreadComment = (props) => {
	const { discussionData, threadCommentData, pubData, updateLocalData, isPreview } = props;
	const { loginData, communityData, locationData } = usePageContext();
	const [isEditing, setIsEditing] = useState(false);
	const [changeObject, setChangeObject] = useState({});
	const [isLoadingEdit, setIsLoadingEdit] = useState(false);

	const handlePutThreadComment = (threadCommentUpdates) => {
		return apiFetch('/api/threadComment', {
			method: 'PUT',
			body: JSON.stringify({
				...threadCommentUpdates,
				accessHash: locationData.query.access,
				parentId: discussionData.id,
				threadId: discussionData.threadId,
				threadCommentId: threadCommentData.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		}).then((updatedThreadCommentData) => {
			updateLocalData('pub', {
				discussions: pubData.discussions.map((discussion) => {
					if (discussion.id === discussionData.id) {
						return {
							...discussion,
							thread: {
								...discussion.thread,
								comments: discussion.thread.comments.map((comment) => {
									if (comment.id === threadCommentData.id) {
										return { ...comment, ...updatedThreadCommentData };
									}
									return comment;
								}),
							},
						};
					}
					return discussion;
				}),
			});
		});
	};

	const isAuthor = loginData.id === threadCommentData.userId;
	return (
		<div className={classNames('thread-comment-component', isPreview && 'is-preview')}>
			<div className="avatar-wrapper">
				<Avatar
					width={18}
					initials={threadCommentData.author.intials}
					avatar={threadCommentData.author.avatar}
				/>
			</div>
			<div className="content-wrapper">
				<div className="item-header">
					<span className="name">
						{threadCommentData.author.fullName}
						{isPreview ? ': ' : ''}
					</span>

					{isPreview && <span className="preview-text">{threadCommentData.text}</span>}
					{!isPreview && (
						<span className="time">
							{!isEditing && (
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
									date={threadCommentData.createdAt}
								/>
							)}
						</span>
					)}

					<span className="actions">
						{!isPreview && isAuthor && (
							<Button
								icon={isEditing ? undefined : <Icon icon="edit2" iconSize={12} />}
								text={isEditing ? 'Cancel' : undefined}
								minimal={true}
								small={true}
								onClick={() => {
									setIsEditing(!isEditing);
								}}
							/>
						)}
					</span>
				</div>
				{!isPreview && (
					<div
						className={classNames({
							'discussion-body-wrapper': true,
							editable: isEditing,
						})}
					>
						<Editor
							key={`${isEditing}-${threadCommentData.text}`}
							isReadOnly={!isEditing}
							initialContent={threadCommentData.content}
							onChange={(editorChangeObject) => {
								if (isEditing) {
									setChangeObject(editorChangeObject);
								}
							}}
						/>
					</div>
				)}
				{isEditing && (
					<React.Fragment>
						<FormattingBarLegacy
							editorChangeObject={changeObject || {}}
							threads={[]}
							hideBlocktypes={true}
							hideExtraFormatting={true}
							isSmall={true}
						/>
						<Button
							small
							className="discussion-primary-button"
							intent={Intent.PRIMARY}
							text="Update Discussion"
							loading={isLoadingEdit}
							disabled={!getText(changeObject.view)}
							onClick={() => {
								setIsLoadingEdit(true);
								handlePutThreadComment({
									content: getJSON(changeObject.view),
									text: getText(changeObject.view) || '',
								}).then(() => {
									setIsEditing(false);
									setChangeObject({});
									setIsLoadingEdit(false);
								});
							}}
						/>
					</React.Fragment>
				)}
			</div>
		</div>
	);
};

ThreadComment.propTypes = propTypes;
ThreadComment.defaultProps = defaultProps;
export default ThreadComment;
