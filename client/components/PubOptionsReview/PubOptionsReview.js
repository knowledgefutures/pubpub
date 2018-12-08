import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import Editor, { docIsEmpty, getJSON } from '@pubpub/editor';
import dateFormat from 'dateformat';
import Avatar from 'components/Avatar/Avatar';
import { apiFetch, generateHash } from 'utilities';

require('./pubOptionsReview.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};

class PubOptionsReview extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: false,
			editorKey: generateHash(),
			selectedStatus: undefined,
			selectedVersion: undefined,
			messageContent: undefined,
		};

		this.getStatusClassName = this.getStatusClassName.bind(this);
		this.handleMessageChange = this.handleMessageChange.bind(this);
		this.handleReviewUpdate = this.handleReviewUpdate.bind(this);
	}

	getStatusClassName(status) {
		if (status === 'unsubmitted' || status === 'closed') { return ''; }
		if (status === 'submitted') { return 'bp3-intent-warning'; }
		if (status === 'accepted') { return 'bp3-intent-success'; }
		if (status === 'rejected') { return 'bp3-intent-danger'; }
		if (status === 'changes requested') { return 'bp3-intent-warning'; }
		return '';
	}

	handleMessageChange(changeObject) {
		this.setState({
			messageContent: docIsEmpty(changeObject.view.state.doc)
				? undefined
				: getJSON(changeObject.view),
		});
	}

	handleReviewUpdate() {
		this.setState({ isLoading: true });

		return apiFetch('/api/pubs/reviews', {
			method: 'PUT',
			body: JSON.stringify({
				reviewItem: {
					versionId: this.state.selectedVersion
						? this.state.selectedVersion.id
						: undefined,
					content: this.state.messageContent,
					status: this.state.selectedVersion
						? 'submitted'
						: this.state.selectedStatus,
				},
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setState({
				isLoading: false,
				editorKey: generateHash(),
				selectedStatus: undefined,
				selectedVersion: undefined,
				messageContent: undefined,
			});

			this.props.setPubData({
				...this.props.pubData,
				review: result,
			});
		})
		.catch((err)=> {
			console.error(err);
			this.setState({ isLoading: false });
		});
	}

	render() {
		const pubData = this.props.pubData;
		const review = pubData.review || [];
		const currentStatus = review.reduce((prev, curr)=> {
			if (curr.status) { return curr.status; }
			return prev;
		}, 'unsubmitted');
		// TODO: permissions in pub.js should let communityAdmins update review even if they are not pubManagers
		// TODO: there are certain types of actions on a review object that only certain parties can make.
		// TODO: who has access to comment/review
		// TODO: automated review services? Plagiarism, spellcheck, etc
		// Integration with discussions?
		// Likely a separate table of reviewItems. Certain users can only create certain types of reviewItems
		// You aggregate the list of all review items for a pub
		// Review events:
		// 	- Open review
		// 	- Close review
		// 	- Set review complete
		//  - Set active review version
		// 	- Add review text
		// 	- Add review changes
		// 	- Assign reviewers

		// Option to move to public is when everyone in a channel approves (or - channel has 'publicTransfer request approver')
		// Types:
		//  - Multiple reviewers in parallel, all in separate channels
		//  - Multiple reviewers in order, all in separate/same channel
		//  - Multiple reviewers in private from author
		// 	- Keep everything private from author until outline completed?


		// To begin a review, select a version (only pub managers can do this);
		// If not manager: Reviews must be initiated by a pub manager
		// If a review has been started:
		// Leave comments
		// Options: Cancel review
		// Options: Approve, Request changes, reject
		// On all cases, present another version selection, but with different message.
		const isAdmin = this.props.loginData.isAdmin;
		const isManager = this.props.pubData.isManager;

		let instructions;
		let placeholder;
		let buttonLanguage;
		let isDisabled;

		if (currentStatus === 'unsubmitted' || currentStatus === 'closed') {
			instructions = 'To begin a new review, select a version you would like to submit for consideration.';
			placeholder = 'Add a message to the submission';
			buttonLanguage = 'Submit version for review';
			isDisabled = !this.state.selectedVersion;
		}
		if (currentStatus === 'submitted') {
			instructions = 'Add a message or change the status of this submission.';
			placeholder = 'Add a message to the review';
			buttonLanguage = (
				<span>
					{this.state.selectedStatus ? 'Set ' : ''}
					<span className="status">{this.state.selectedStatus}</span>
					{this.state.selectedStatus && this.state.messageContent ? ' and ' : ''}
					{this.state.messageContent ? 'Add message' : ''}
					{!this.state.selectedStatus && !this.state.messageContent ? 'Update status or Add Message ' : ''}
				</span>
			);
			isDisabled = !this.state.messageContent && !this.state.selectedStatus;
		}
		if (currentStatus === 'accepted') {
			instructions = 'Your version has been accepted! You may begin a new review on a new version below.';
			placeholder = 'Add a message to the review';
			buttonLanguage = this.state.selectedVersion
				? 'Submit version for review'
				: 'Add message';
			isDisabled = !this.state.selectedVersion && !this.state.messageContent;
		}
		if (currentStatus === 'rejected') {
			instructions = 'Your version has been rejected. You may begin a new review on a new version below.';
			placeholder = 'Add a message to the review';
			buttonLanguage = this.state.selectedVersion
				? 'Submit version for review'
				: 'Add message';
			isDisabled = !this.state.selectedVersion && !this.state.messageContent;
		}
		if (currentStatus === 'changes requested') {
			instructions = 'Changes have been requested. You can make these changes, save them in a new version, and then select that version for review below.';
			placeholder = 'Add a message to the review';
			buttonLanguage = this.state.selectedVersion
				? 'Submit changes for review'
				: 'Add message';
			isDisabled = !this.state.selectedVersion && !this.state.messageContent;
		}

		const usersById = {};
		this.props.communityData.admins.forEach((user)=> {
			usersById[user.id] = user;
		});
		this.props.pubData.managers.forEach((manager)=> {
			usersById[manager.user.id] = manager.user;
		});

		const versionsById = {};
		this.props.pubData.versions.forEach((version)=> {
			versionsById[version.id] = version;
		});

		return (
			<div className="pub-options-review-component">
				<div className="header-bar">
					<h1>Review</h1>
					<div>
						<span className={`bp3-tag ${this.getStatusClassName(currentStatus)}`}>Status: {currentStatus}</span>
					</div>
				</div>

				{!this.props.pubData.versions.length &&
					<div className="bp3-callout bp3-intent-warning">
						Reviews apply to specific versions. To begin a review you must first save a version of the working draft. You will then have options here to select the specific version you would like to submit for review.
					</div>
				}

				{(isAdmin || isManager) && !!this.props.pubData.versions.length &&
					<div>
						<p>{instructions}</p>
						{currentStatus !== 'submitted' &&
							<Select
								items={this.props.pubData.versions}
								filterable={false}
								itemRenderer={(item, { handleClick, modifiers })=> {
									return (
										<button
											type="button"
											tabIndex={-1}
											onClick={handleClick}
											className={modifiers.active ? 'bp3-menu-item bp3-active' : 'bp3-menu-item'}
										>
											Version: {dateFormat(item.createdAt, 'mmm dd, yyyy · h:MMTT')}
										</button>
									);
								}}
								onItemSelect={(item)=> {
									this.setState({
										selectedVersion: item,
									});
								}}
								popoverProps={{ popoverClassName: 'bp3-minimal' }}
								inputProps={{ className: 'bp3-fill' }}
							>
								<Button
									text={this.state.selectedVersion ? `Version: ${dateFormat(this.state.selectedVersion.createdAt, 'mmm dd, yyyy · h:MMTT')}` : 'Select a Version'}
									rightIcon="caret-down"
								/>
							</Select>
						}
						<Editor
							key={this.state.editorKey}
							onChange={this.handleMessageChange}
							customPlugins={{
								headerIds: undefined,
								highlights: undefined,
							}}
							placeholder={placeholder}
						/>
						{currentStatus === 'submitted' &&
							<div>Set Status:</div>
						}
						<div className="button-row">
							{currentStatus === 'submitted' &&
								<div className="statuses">
									<div className="bp3-button-group">
										<Button
											text="Submitted"
											className={!this.state.selectedStatus ? 'bp3-active' : ''}
											onClick={()=> {
												this.setState({ selectedStatus: undefined });
											}}
										/>
										{isManager &&
											<Button
												text="Closed"
												className={this.state.selectedStatus === 'closed' ? 'bp3-active' : ''}
												onClick={()=> {
													this.setState({ selectedStatus: 'closed' });
												}}
											/>
										}
										{isAdmin &&
											<Button
												text="Accepted"
												className={this.state.selectedStatus === 'accepted' ? 'bp3-active' : ''}
												onClick={()=> {
													this.setState({ selectedStatus: 'accepted' });
												}}
											/>
										}
										{isAdmin &&
											<Button
												text="Rejected"
												className={this.state.selectedStatus === 'rejected' ? 'bp3-active' : ''}
												onClick={()=> {
													this.setState({ selectedStatus: 'rejected' });
												}}
											/>
										}
										{isAdmin &&
											<Button
												text="Changes Requested"
												className={this.state.selectedStatus === 'changes requested' ? 'bp3-active' : ''}
												onClick={()=> {
													this.setState({ selectedStatus: 'changes requested' });
												}}
											/>
										}
									</div>
								</div>
							}
							<Button
								text={buttonLanguage}
								className="bp3-intent-primary"
								disabled={isDisabled}
								loading={this.state.isLoading}
								onClick={()=> {
									this.handleReviewUpdate();
								}}
							/>
						</div>
					</div>
				}

				{/* History of events */}
				{review.slice().sort((foo, bar)=> {
					if (foo.createdAt > bar.createdAt) { return -1; }
					if (foo.createdAt < bar.createdAt) { return 1; }
					return 0;
				}).map((reviewItem)=> {
					const user = usersById[reviewItem.userId];
					const version = versionsById[reviewItem.versionId];
					return (
						<div className="review-item" key={reviewItem.createdAt}>
							<Avatar width={25} userInitials={user.initials} userAvatar={user.avatar} />
							<div className="item-header">
								<div className="date">
									{dateFormat(reviewItem.createdAt, 'mmm dd, yyyy · h:MMTT')}
								</div>
								<div className="name">{user.fullName}</div>
								{reviewItem.status &&
									<div className="status-change">
										Status Changed to: <span className={`bp3-tag ${this.getStatusClassName(reviewItem.status)}`}>{reviewItem.status}</span>
									</div>
								}
							</div>
							{reviewItem.versionId &&
								<div className="bp3-callout">
									Submitted <a href={`/pub/${pubData.slug}?version=${version.id}`}>Version {dateFormat(version.createdAt, 'mmm dd, yyyy · h:MMTT')}</a>
								</div>
							}
							{reviewItem.content &&
								<Editor
									customPlugins={{
										headerIds: undefined,
										highlights: undefined,
									}}
									initialContent={reviewItem.content}
									isReadOnly={true}
								/>
							}
						</div>
					);
				})}
			</div>
		);
	}
}

PubOptionsReview.propTypes = propTypes;
export default PubOptionsReview;
