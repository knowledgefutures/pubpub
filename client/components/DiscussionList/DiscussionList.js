import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DiscussionThread from 'components/DiscussionThread/DiscussionThread';
import DiscussionLabelsList from 'components/DiscussionLabelsList/DiscussionLabelsList';
import DiscussionSortList from 'components/DiscussionSortList/DiscussionSortList';
import DiscussionInput from 'components/DiscussionInput/DiscussionInput';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import {
	Popover,
	PopoverInteractionKind,
	Position,
	NonIdealState,
	Button,
} from '@blueprintjs/core';

require('./discussionList.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	threads: PropTypes.array.isRequired,
	onLabelsSave: PropTypes.func.isRequired,
	onPostDiscussion: PropTypes.func.isRequired,
	onPutDiscussion: PropTypes.func.isRequired,
	getHighlightContent: PropTypes.func.isRequired,
	setDiscussionChannel: PropTypes.func.isRequired,
	activeDiscussionChannel: PropTypes.object,
	handleQuotePermalink: PropTypes.func.isRequired,
};

const defaultProps = {
	activeDiscussionChannel: { title: 'public' },
};

class DiscussionList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isArchivedMode: false,
			filteredLabels: [],
			filteredAuthors: [],
			sortMode: 'newestThread', // newestThread, oldestThread, newestReply, oldestReply, mostReplies, leastReplies
			newThreadLoading: false,
		};
		this.setDiscussionsMode = this.setDiscussionsMode.bind(this);
		this.setArchivedMode = this.setArchivedMode.bind(this);
		this.toggleFilteredLabel = this.toggleFilteredLabel.bind(this);
		this.toggleFilteredAuthor = this.toggleFilteredAuthor.bind(this);
		this.setSortMode = this.setSortMode.bind(this);
		this.filterAndSortThreads = this.filterAndSortThreads.bind(this);
		this.handlePostNewThread = this.handlePostNewThread.bind(this);
	}

	setDiscussionsMode() {
		this.setState({
			isArchivedMode: false,
		});
	}

	setArchivedMode() {
		this.setState({
			isArchivedMode: true,
		});
	}

	setSortMode(sortSlug) {
		this.setState({ sortMode: sortSlug });
	}

	handlePostNewThread(discussionObject) {
		this.setState({ newThreadLoading: true });
		return this.props.onPostDiscussion(discussionObject).then(() => {
			this.setState({ newThreadLoading: false });
		});
	}

	toggleFilteredAuthor(authorId) {
		this.setState((prevState) => {
			const newFilteredAuthors =
				prevState.filteredAuthors.indexOf(authorId) > -1
					? prevState.filteredAuthors.filter((id) => {
							return id !== authorId;
					  })
					: [...prevState.filteredAuthors, authorId];
			return { filteredAuthors: newFilteredAuthors };
		});
	}

	toggleFilteredLabel(labelId) {
		this.setState((prevState) => {
			const newFilteredLabels =
				prevState.filteredLabels.indexOf(labelId) > -1
					? prevState.filteredLabels.filter((id) => {
							return id !== labelId;
					  })
					: [...prevState.filteredLabels, labelId];
			return { filteredLabels: newFilteredLabels };
		});
	}

	filterAndSortThreads(threads, isArchivedList) {
		return threads
			.filter((items) => {
				const threadIsArchived = items.reduce((prev, curr) => {
					if (curr.isArchived) {
						return true;
					}
					return prev;
				}, false);
				return isArchivedList ? threadIsArchived : !threadIsArchived;
			})
			.filter((items) => {
				const threadLabels = items.reduce((prev, curr) => {
					if (curr.labels && curr.labels.length) {
						return curr.labels;
					}
					return prev;
				}, []);
				if (this.state.filteredLabels.length === 0) {
					return true;
				}
				const hasNecessaryLabel = this.state.filteredLabels.reduce((prev, curr) => {
					if (threadLabels.indexOf(curr) === -1) {
						return false;
					}
					return prev;
				}, true);
				return hasNecessaryLabel;
			})
			.filter((items) => {
				const authors = {};
				items.forEach((discussion) => {
					authors[discussion.author.id] = discussion.author;
				});
				if (this.state.filteredAuthors.length === 0) {
					return true;
				}
				const hasNecessaryAuthor = this.state.filteredAuthors.reduce((prev, curr) => {
					if (!authors[curr]) {
						return false;
					}
					return prev;
				}, true);
				return hasNecessaryAuthor;
			})
			.sort((foo, bar) => {
				/* Newest Thread */
				if (
					this.state.sortMode === 'newestThread' &&
					foo[0].threadNumber > bar[0].threadNumber
				) {
					return -1;
				}
				if (
					this.state.sortMode === 'newestThread' &&
					foo[0].threadNumber < bar[0].threadNumber
				) {
					return 1;
				}
				/* Oldest Thread */
				if (
					this.state.sortMode === 'oldestThread' &&
					foo[0].threadNumber < bar[0].threadNumber
				) {
					return -1;
				}
				if (
					this.state.sortMode === 'oldestThread' &&
					foo[0].threadNumber > bar[0].threadNumber
				) {
					return 1;
				}
				/* Newest Reply */
				const fooNewestReply = foo.reduce((prev, curr) => {
					if (curr.createdAt > prev) {
						return curr.createdAt;
					}
					return prev;
				}, '0000-02-01T22:21:19.608Z');
				const barNewestReply = bar.reduce((prev, curr) => {
					if (curr.createdAt > prev) {
						return curr.createdAt;
					}
					return prev;
				}, '0000-02-01T22:21:19.608Z');
				if (this.state.sortMode === 'newestReply' && fooNewestReply > barNewestReply) {
					return -1;
				}
				if (this.state.sortMode === 'newestReply' && fooNewestReply < barNewestReply) {
					return 1;
				}
				/* Oldest Reply */
				const fooOldestReply = foo.reduce((prev, curr) => {
					if (curr.createdAt < prev) {
						return curr.createdAt;
					}
					return prev;
				}, '9999-02-01T22:21:19.608Z');
				const barOldestReply = bar.reduce((prev, curr) => {
					if (curr.createdAt < prev) {
						return curr.createdAt;
					}
					return prev;
				}, '9999-02-01T22:21:19.608Z');
				if (this.state.sortMode === 'oldestReply' && fooOldestReply < barOldestReply) {
					return -1;
				}
				if (this.state.sortMode === 'oldestReply' && fooOldestReply > barOldestReply) {
					return 1;
				}
				/* Most Replies */
				if (this.state.sortMode === 'mostReplies' && foo.length > bar.length) {
					return -1;
				}
				if (this.state.sortMode === 'mostReplies' && foo.length < bar.length) {
					return 1;
				}
				/* Least Replies */
				if (this.state.sortMode === 'leastReplies' && foo.length < bar.length) {
					return -1;
				}
				if (this.state.sortMode === 'leastReplies' && foo.length > bar.length) {
					return 1;
				}
				return 0;
			});
	}

	render() {
		const pubData = this.props.pubData;
		const threads = this.props.threads;

		const activeThreads = this.filterAndSortThreads(threads, false);
		const archivedThreads = this.filterAndSortThreads(threads, true);
		const filtersActive = this.state.filteredLabels.length || this.state.filteredAuthors.length;

		const threadsToShow = this.state.isArchivedMode ? archivedThreads : activeThreads;
		const discussionChannels = [
			{ title: 'public' },
			...pubData.discussionChannels.filter((channel) => {
				return !channel.isArchived;
			}),
		];

		return (
			<div className="discussion-list-component">
				<div className="discussion-header">
					<h2>Discussions</h2>

					<DropdownButton
						label={`#${this.props.activeDiscussionChannel.title}`}
						// icon={items[props.value].icon}
						isRightAligned={true}
					>
						<ul className="channel-permissions-dropdown bp3-menu">
							{discussionChannels.map((channel) => {
								return (
									<li key={`channel-option-${channel.title}`}>
										<button
											className="bp3-menu-item bp3-popover-dismiss"
											onClick={() => {
												this.props.setDiscussionChannel(channel.title);
											}}
											type="button"
										>
											#{channel.title}
										</button>
									</li>
								);
							})}
						</ul>
					</DropdownButton>
				</div>

				<div className="new-discussion-wrapper">
					<DiscussionInput
						initialContent={undefined}
						handleSubmit={this.handlePostNewThread}
						showTitle={true}
						submitIsLoading={this.state.newThreadLoading}
						getHighlightContent={this.props.getHighlightContent}
						inputKey="bottom-general"
						activeDiscussionChannel={this.props.activeDiscussionChannel}
					/>
				</div>

				<div className="filter-bar">
					<div className="left">
						<Button
							className={`bp3-minimal ${!this.state.isArchivedMode ? 'active' : ''}`}
							onClick={this.setDiscussionsMode}
							text={`${activeThreads.length} Discussion${
								activeThreads.length === 1 ? '' : 's'
							}`}
						/>
						<Button
							className={`bp3-minimal ${this.state.isArchivedMode ? 'active' : ''}`}
							onClick={this.setArchivedMode}
							text={`${archivedThreads.length} Archived`}
						/>
					</div>
					<div className="right">
						{/* <Popover
							content={
								<DiscussionAuthorsList
									threadsData={threads || []}
									selected={this.state.filteredAuthors}
									onSelect={this.toggleFilteredAuthor}
								/>
							}
							interactionKind={PopoverInteractionKind.CLICK}
							position={Position.BOTTOM_RIGHT}
							popoverClassName="bp3-minimal"
							transitionDuration={-1}
							inheritDarkTheme={false}
						>
							<div className={`bp3-button bp3-minimal ${this.state.filteredAuthors.length ? 'active' : ''}`}>Authors</div>
						</Popover>
						*/}
						<Popover
							content={
								<DiscussionLabelsList
									labelsData={pubData.labels || []}
									selectedLabels={this.state.filteredLabels}
									isManager={pubData.isManager}
									onLabelSelect={this.toggleFilteredLabel}
									onLabelsUpdate={this.props.onLabelsSave}
								/>
							}
							interactionKind={PopoverInteractionKind.CLICK}
							position={Position.BOTTOM_RIGHT}
							popoverClassName="bp3-minimal"
							transitionDuration={-1}
							inheritDarkTheme={false}
						>
							<div
								className={`bp3-button bp3-minimal ${
									this.state.filteredLabels.length ? 'active' : ''
								}`}
							>
								Labels
							</div>
						</Popover>
						<Popover
							content={
								<DiscussionSortList
									selected={this.state.sortMode}
									onSelect={this.setSortMode}
								/>
							}
							interactionKind={PopoverInteractionKind.CLICK}
							position={Position.BOTTOM_RIGHT}
							popoverClassName="bp3-minimal"
							transitionDuration={-1}
							inheritDarkTheme={false}
						>
							<div
								className={`bp3-button bp3-minimal ${
									this.state.sortMode !== 'newestThread' ? 'active' : ''
								}`}
							>
								Sort
							</div>
						</Popover>
					</div>
				</div>

				{!this.state.isArchivedMode && !activeThreads.length && (
					<NonIdealState
						title={filtersActive ? 'No Discussions Match Filter' : 'No Discussions Yet'}
						visual="bp3-icon-widget"
					/>
				)}

				{this.state.isArchivedMode && !archivedThreads.length && (
					<NonIdealState
						title={
							filtersActive
								? 'No Archived Discussions Match Filter'
								: 'No Archived Discussions'
						}
						visual="bp3-icon-widget"
					/>
				)}
				{threadsToShow.map((thread) => {
					return (
						<DiscussionThread
							key={`thread-${thread[0].id}`}
							thread={thread}
							isMinimal={false}
							pubData={this.props.pubData}
							locationData={this.props.locationData}
							loginData={this.props.loginData}
							onPostDiscussion={this.props.onPostDiscussion}
							onPutDiscussion={this.props.onPutDiscussion}
							getHighlightContent={this.props.getHighlightContent}
							handleQuotePermalink={this.props.handleQuotePermalink}
						/>
					);
				})}
			</div>
		);
	}
}

DiscussionList.propTypes = propTypes;
DiscussionList.defaultProps = defaultProps;
export default DiscussionList;
