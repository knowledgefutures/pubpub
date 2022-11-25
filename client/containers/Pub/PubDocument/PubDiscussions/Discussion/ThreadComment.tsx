import React, { useState } from 'react';
import TimeAgo from 'react-timeago';
import classNames from 'classnames';
import { Button, Intent } from '@blueprintjs/core';

import Editor, { getText, getJSON, EditorChangeObject, viewIsEmpty } from 'components/Editor';
import { FormattingBar, buttons } from 'components/FormattingBar';
import { Avatar, Icon } from 'components';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';
import { Callback } from 'types';
import { getPartsOfFullName } from 'utils/names';

require('./threadComment.scss');

type Props = {
	discussionData: any;
	threadCommentData: any;
	pubData: any;
	updateLocalData: (...args: any[]) => any;
	isPreview?: boolean;
};

const ThreadComment = (props: Props) => {
	const {
		discussionData,
		threadCommentData,
		pubData,
		updateLocalData,
		isPreview = false,
	} = props;
	const { loginData, communityData, locationData } = usePageContext();
	const [isEditing, setIsEditing] = useState(false);
	const [changeObject, setChangeObject] = useState<null | EditorChangeObject>(null);
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
	const renderText = (
		key: string,
		isReadOnly: boolean,
		onChange?: Callback<EditorChangeObject>,
	) => {
		return (
			<Editor
				key={key}
				isReadOnly={isReadOnly}
				initialContent={threadCommentData.content}
				onChange={onChange}
			/>
		);
	};
	const commenterName = discussionData.commenter?.name ?? threadCommentData.commenter?.name;
	return (
		<div className={classNames('thread-comment-component', isPreview && 'is-preview')}>
			<div className="avatar-wrapper">
				<Avatar
					width={18}
					initials={
						threadCommentData.author
							? threadCommentData.author.intials
							: commenterName
							? getPartsOfFullName(commenterName).initials
							: '?'
					}
					avatar={threadCommentData.author?.avatar}
				/>
			</div>
			<div className="content-wrapper">
				<div className="item-header">
					<span className="name">
						{threadCommentData.author
							? threadCommentData.author.fullName
							: commenterName ?? 'anonymous'}
						{isPreview ? ': ' : ''}
					</span>

					{isPreview && (
						<span className="preview-text">
							{renderText(`preview-${threadCommentData.text}`, true)}
						</span>
					)}
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
						{isEditing && changeObject && (
							<FormattingBar
								editorChangeObject={changeObject}
								buttons={buttons.discussionButtonSet}
								isSmall
							/>
						)}
						{renderText(
							`${isEditing}-${threadCommentData.text}`,
							!isEditing,
							(editorChangeObject: EditorChangeObject) => {
								if (isEditing) {
									setChangeObject(editorChangeObject);
								}
							},
						)}
					</div>
				)}
				{isEditing && (
					<Button
						small
						className="discussion-primary-button"
						intent={Intent.PRIMARY}
						text="Update Discussion"
						loading={isLoadingEdit}
						disabled={!!changeObject && viewIsEmpty(changeObject.view.state)}
						onClick={() => {
							setIsLoadingEdit(true);
							handlePutThreadComment({
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
								content: getJSON(changeObject.view),
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
								text: getText(changeObject.view) || '',
							}).then(() => {
								setIsEditing(false);
								setChangeObject(null);
								setIsLoadingEdit(false);
							});
						}}
					/>
				)}
			</div>
		</div>
	);
};

export default ThreadComment;
