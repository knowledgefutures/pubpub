import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, AnchorButton } from '@blueprintjs/core';
import DiscussionInput from 'components/DiscussionInput/DiscussionInput';
import DiscussionLabels from 'components/DiscussionLabels/DiscussionLabels';
import DiscussionThreadItem from 'components/DiscussionThreadItem/DiscussionThreadItem';
import Avatar from 'components/Avatar/Avatar';

require('./discussionThread.scss');

const propTypes = {
	thread: PropTypes.array.isRequired,
	isMinimal: PropTypes.bool.isRequired,
	pubData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	onPostDiscussion: PropTypes.func.isRequired,
	onPutDiscussion: PropTypes.func.isRequired,
	getHighlightContent: PropTypes.func.isRequired,
	handleQuotePermalink: PropTypes.func.isRequired,
	setActiveThread: PropTypes.func,
	activeThread: PropTypes.string,
};

const defaultProps = {
	setActiveThread: undefined,
	activeThread: undefined,
};

class DiscussionThread extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isExpanded: false,
			isEditing: false,
			isLoadingArchive: false,
			isLoadingThreadEdit: false,
			isLoadingReply: false,
			title: this.props.thread.reduce((prev, curr) => {
				return curr.title || prev;
			}, ''),
		};
		this.archiveDiscussion = this.archiveDiscussion.bind(this);
		this.handleThreadEdit = this.handleThreadEdit.bind(this);
		this.handleReplySubmit = this.handleReplySubmit.bind(this);
		this.handleExpand = this.handleExpand.bind(this);
	}

	archiveDiscussion() {
		const sortedDiscussions = this.props.thread.sort((foo, bar) => {
			if (foo.createdAt > bar.createdAt) {
				return 1;
			}
			if (foo.createdAt < bar.createdAt) {
				return -1;
			}
			return 0;
		});
		this.setState({ isLoadingArchive: true });
		this.props.onPutDiscussion({
			isArchived: !sortedDiscussions[0].isArchived,
			pubId: sortedDiscussions[0].pubId,
			discussionId: sortedDiscussions[0].id,
			userId: sortedDiscussions[0].userId,
		});
	}

	handleExpand() {
		const isExpanded =
			this.state.isExpanded || this.props.activeThread === this.props.thread[0].threadNumber;
		if (!isExpanded && this.props.setActiveThread) {
			this.props.setActiveThread(this.props.thread[0].threadNumber);
		}
		if (!isExpanded && !this.props.setActiveThread) {
			this.setState({ isExpanded: true });
		}
		if (isExpanded && this.props.setActiveThread) {
			this.props.setActiveThread(undefined);
		}
		if (isExpanded && !this.props.setActiveThread) {
			this.setState({ isExpanded: false });
		}
	}

	handleReplySubmit(replyObject) {
		this.setState({ isLoadingReply: true });
		this.props
			.onPostDiscussion({
				userId: this.props.loginData.id,
				threadNumber: this.props.thread[0].threadNumber,
				// isPublic: this.props.thread[0].isPublic,
				discussionChannelId: this.props.thread[0].discussionChannelId,
				pubId: this.props.thread[0].pubId,
				content: replyObject.content,
				text: replyObject.text,
				highlights: replyObject.highlights,
			})
			.then(() => {
				this.setState({ isLoadingReply: false });
			});
	}

	handleThreadEdit(evt) {
		evt.preventDefault();
		const sortedDiscussions = this.props.thread.sort((foo, bar) => {
			if (foo.createdAt > bar.createdAt) {
				return 1;
			}
			if (foo.createdAt < bar.createdAt) {
				return -1;
			}
			return 0;
		});

		this.setState({ isLoadingThreadEdit: true });
		this.props
			.onPutDiscussion({
				title: this.state.title,
				labels: this.state.labels,
				pubId: sortedDiscussions[0].pubId,
				discussionId: sortedDiscussions[0].id,
				userId: sortedDiscussions[0].userId,
			})
			.then(() => {
				this.setState({
					isLoadingThreadEdit: false,
					isEditing: false,
				});
			});
	}

	render() {
		// TODO: sortedDiscussions is unnecessary. getnestedhtreads in utilities sorts.
		const sortedDiscussions = this.props.thread.sort((foo, bar) => {
			if (foo.createdAt > bar.createdAt) {
				return 1;
			}
			if (foo.createdAt < bar.createdAt) {
				return -1;
			}
			return 0;
		});

		const canManageThread =
			sortedDiscussions[0].userId ===
				this.props.loginData.id /* User is author of thread */ ||
			this.props.pubData.isManager; /* or, User is a pub manager */

		const isArchived = sortedDiscussions[0].isArchived;

		const availableLabels = this.props.pubData.labels || [];
		const labelsById = {};
		availableLabels.forEach((label) => {
			labelsById[label.id] = label;
		});
		const labels = sortedDiscussions[0].labels || [];

		const isExpanded =
			this.state.isExpanded || this.props.activeThread === this.props.thread[0].threadNumber;
		return (
			<div className="discussion-thread-component">
				{/* Discussion Preview */}
				{!isExpanded && (
					<div
						className={`preview ${this.props.isMinimal ? 'minimal' : ''}`}
						onClick={this.handleExpand}
						role="button"
						tabIndex="-1"
					>
						{/* If not minimal mode, show title and labels */}
						{!this.props.isMinimal && (
							<div className="title">
								<span className="text">{sortedDiscussions[0].title}</span>
								{labels
									.filter((labelId) => {
										return labelsById[labelId];
									})
									.sort((foo, bar) => {
										if (labelsById[foo].title < labelsById[bar].title) {
											return -1;
										}
										if (labelsById[foo].title > labelsById[bar].title) {
											return 1;
										}
										return 0;
									})
									.map((labelId) => {
										const label = labelsById[labelId];
										return (
											<span
												className="bp3-tag"
												style={{ backgroundColor: label.color }}
											>
												{label.title}
											</span>
										);
									})}
							</div>
						)}

						{/* Show first three replies */}
						{sortedDiscussions.slice(0, 3).map((discussion, index, array) => {
							/* If isMinimal, and string is sufficently long, replace with ellipsis */
							const previewLimit = this.props.isMinimal ? 45 : 200;
							const previewText =
								discussion.text.length > previewLimit
									? `${discussion.text.substring(0, previewLimit - 3)}...`
									: discussion.text;
							return (
								<div
									className="discussion"
									key={`discussion-preview-${discussion.id}`}
								>
									{index + 1 !== array.length && <div className="line" />}
									<Avatar
										width={20}
										userInitials={discussion.author.initials}
										userAvatar={discussion.author.avatar}
									/>
									<div className="text">
										<b>{discussion.author.fullName}: </b>
										{previewText}
									</div>
								</div>
							);
						})}

						{/* Show data about thread. Date created and replies */}
						{sortedDiscussions.length > 3 && (
							<div className="more">{sortedDiscussions.length - 3} more...</div>
						)}
					</div>
				)}

				{/* Full Discussion */}
				{isExpanded && (
					<div className={`full ${this.props.isMinimal ? 'minimal' : ''}`}>
						<div className="collapse-wrapper">
							<Button
								className="bp3-minimal bp3-fill"
								onClick={this.handleExpand}
								text="Collapse Thread"
							/>
						</div>
						{isArchived && (
							<div className="bp3-callout bp3-intent-danger">
								{!sortedDiscussions[0].submitHash && 'Thread is Archived'}
								{canManageThread && (
									<Button
										type="button"
										text="Unarchive"
										className="bp3-small"
										loading={this.state.isLoadingArchive}
										onClick={this.archiveDiscussion}
									/>
								)}
							</div>
						)}
						{canManageThread && !this.state.isEditing && !isArchived && (
							<div className="thread-buttons bp3-button-group bp3-small">
								<Button
									text="Edit"
									onClick={() => {
										this.setState({ isEditing: true });
									}}
								/>
								<Button
									text="Archive"
									loading={this.state.isLoadingArchive}
									onClick={this.archiveDiscussion}
								/>
							</div>
						)}
						{this.state.isEditing && (
							<div>
								<input
									value={this.state.title}
									onChange={(evt) => {
										this.setState({ title: evt.target.value });
									}}
									className="bp3-input bp3-fill"
									type="text"
								/>
								<div className="editing-buttons">
									<Button
										text="Cancel Edit"
										className="bp3-small"
										onClick={() => {
											this.setState({ isEditing: false });
										}}
									/>
									<Button
										name="submit"
										type="submit"
										text="Edit Title"
										className="bp3-small bp3-intent-primary"
										onClick={this.handleThreadEdit}
										loading={this.state.isLoadingThreadEdit}
									/>
								</div>
							</div>
						)}
						{!this.state.isEditing && <b>{sortedDiscussions[0].title}</b>}
						<DiscussionLabels
							availableLabels={this.props.pubData.labels || []}
							labelsData={sortedDiscussions[0].labels || []}
							onLabelsSave={this.saveLabels}
							isAdmin={this.props.loginData.isAdmin}
							canManageThread={canManageThread}
						/>
						{sortedDiscussions.map((discussion) => {
							return (
								<DiscussionThreadItem
									key={`discussion-${discussion.id}`}
									discussion={discussion}
									isAuthor={
										isArchived
											? false
											: discussion.userId === this.props.loginData.id ||
											  this.props.loginData.id ===
													'b242f616-7aaa-479c-8ee5-3933dcf70859'
									}
									onReplyEdit={this.props.onPutDiscussion}
									// hideScrollButton={this.props.hideScrollButton}
									getHighlightContent={this.props.getHighlightContent}
									handleQuotePermalink={this.props.handleQuotePermalink}
									// hoverBackgroundColor={this.props.hoverBackgroundColor}
									hoverBackgroundColor="rgba(0, 80, 200, 0.2)"
								/>
							);
						})}
						{!isArchived && (
							<div>
								{this.props.loginData.id ? (
									<DiscussionInput
										handleSubmit={this.handleReplySubmit}
										submitIsLoading={this.state.isLoadingReply}
										getHighlightContent={this.props.getHighlightContent}
										inputKey="thread-reply"
									/>
								) : (
									<AnchorButton
										href={`/login?redirect=${
											this.props.locationData.pathpathname
										}`}
										className="bp3-fill"
										text="Login to Reply"
									/>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		);
	}
}

DiscussionThread.propTypes = propTypes;
DiscussionThread.defaultProps = defaultProps;
export default DiscussionThread;
