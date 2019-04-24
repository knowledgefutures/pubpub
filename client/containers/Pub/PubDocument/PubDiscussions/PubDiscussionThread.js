import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import Editor from '@pubpub/editor';
import { Button, Intent } from '@blueprintjs/core';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { Avatar, Icon } from 'components';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	discussionId: PropTypes.string.isRequired,
	discussionState: PropTypes.object.isRequired,
	dispatch: PropTypes.func.isRequired,
	threadData: PropTypes.array.isRequired,
};

const PubDiscussionThread = (props) => {
	const { discussionId, discussionState, dispatch, threadData } = props;
	const { isOpen, editorState } = discussionState;
	const { loginData, communityData } = useContext(PageContext);
	// console.log(threadData);
	if (!isOpen) {
		return null;
	}
	return (
		<div className="discussion-thread" tabIndex={-1}>
			{threadData.map((item) => {
				return (
					<div className="discussion-item" key={item.id}>
						<div className="avatar-wrapper">
							<Avatar
								width={30}
								userInitials={item.author.intials}
								userAvatar={item.author.avatar}
							/>
						</div>
						<div className="content-wrapper">
							<div className="item-header">
								<span className="name">{item.author.fullName}</span>
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
										date={item.createdAt}
									/>
									{item.createdAt !== item.updatedAt && <span> (edited)</span>}
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
								<Editor isReadOnly={true} initialContent={item.content} />
							</div>
						</div>
					</div>
				);
			})}
			<div className="discussion-item">
				<div className="avatar-wrapper">
					<Avatar
						width={30}
						userInitials={loginData.intials}
						userAvatar={loginData.avatar}
					/>
				</div>
				<div className="content-wrapper">
					<div className="discussion-body-wrapper editable">
						<Editor
							placeholder="Type your discussion here..."
							// This calls .toJSON everytime which seems inefficient
							// Why do we only need this for local changes to doc - and not remote edits?
							// initialContent={
							// 	editorState && editorState.doc
							// 		? editorState.doc.toJSON()
							// 		: undefined
							// }
							// onChange={(editorChangeObject) => {
							// 	if (!editorState) {
							// 		editorChangeObject.view.focus();
							// 	}

							// 	setDiscussionEditorView(editorChangeObject.view);
							// 	dispatch({
							// 		id: discussionId,
							// 		key: 'editorState',
							// 		value: { ...editorChangeObject.view.state },
							// 	});
							// }}
						/>
					</div>
					<Button
						className="discussion-primary-button"
						intent={Intent.PRIMARY}
						text="Post Discussion"
						// loading={isLoading}
						// onClick={handlePostDiscussion}
					/>
					<Button
						text="Cancel"
						onClick={() => {
							// removeLocalHighlight(pubView, discussionId);
							// dispatch({ id: discussionId, delete: true });
						}}
					/>
				</div>
			</div>
		</div>
	);
};

PubDiscussionThread.propTypes = propTypes;
export default PubDiscussionThread;
