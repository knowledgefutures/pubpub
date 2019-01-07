import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Button, Intent, EditableText } from '@blueprintjs/core';
import PubOptionsSharingCard from 'components/PubOptionsSharingCard/PubOptionsSharingCard';
import UserAutocomplete from 'components/UserAutocomplete/UserAutocomplete';
import Avatar from 'components/Avatar/Avatar';
import Icon from 'components/Icon/Icon';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import { apiFetch, slugifyString } from 'utilities';

require('./pubOptionsDiscussions.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};

class PubOptionsDiscussions extends Component {
	constructor(props) {
		super(props);
		this.state = {
			pubData: props.pubData,
			newChannelTitle: '',
			channelArchiveLoading: '',
		};
		this.handleChannelAdd = this.handleChannelAdd.bind(this);
		this.handleChannelUpdate = this.handleChannelUpdate.bind(this);
		this.handleChannelParticipantAdd = this.handleChannelParticipantAdd.bind(this);
		this.handleChannelParticipantDelete = this.handleChannelParticipantDelete.bind(this);
	}

	handleChannelAdd(evt) {
		evt.preventDefault();
		return apiFetch('/api/discussionChannels', {
			method: 'POST',
			body: JSON.stringify({
				title: this.state.newChannelTitle,
				pubId: this.state.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((newDiscussionChannel)=> {
			this.setState((prevState)=> {
				const newPubData = {
					...prevState.pubData,
					discussionChannels: [
						newDiscussionChannel,
						...prevState.pubData.discussionChannels
					],
				};
				this.props.setPubData(newPubData);
				return {
					newChannelTitle: '',
					pubData: newPubData,
				};
			});
		})
		.catch((err)=> {
			console.error('Error creating discussion channel', err);
		});
	}

	handleChannelUpdate(updatedChannelObject, isArchiveToggle) {
		if (isArchiveToggle) {
			this.setState({ channelArchiveLoading: updatedChannelObject.discussionChannelId });
		}
		return apiFetch('/api/discussionChannels', {
			method: 'PUT',
			body: JSON.stringify({
				...updatedChannelObject,
				pubId: this.state.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((newDiscussionChannelData)=> {
			this.setState((prevState)=> {
				const newPubData = {
					...prevState.pubData,
					discussionChannels: prevState.pubData.discussionChannels.map((channel)=> {
						if (channel.id !== updatedChannelObject.discussionChannelId) { return channel; }
						return {
							...channel,
							...newDiscussionChannelData,
						};
					})
				};
				this.props.setPubData(newPubData);
				return { pubData: newPubData, channelArchiveLoading: '' };
			});
		})
		.catch((err)=> {
			console.error('Error updated discussion channel', err);
		});
	}

	handleChannelParticipantAdd(newChannelParticipant) {
		return apiFetch('/api/discussionChannelParticipants', {
			method: 'POST',
			body: JSON.stringify({
				...newChannelParticipant,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setState((prevState)=> {
				const newPubData = {
					...prevState.pubData,
					discussionChannels: prevState.pubData.discussionChannels.map((channel)=> {
						if (channel.id !== newChannelParticipant.discussionChannelId) { return channel; }
						return {
							...channel,
							participants: [
								...channel.participants,
								result
							]
						};
					})
				};
				this.props.setPubData(newPubData);
				return { pubData: newPubData };
			});
		});
	}

	handleChannelParticipantUpdate(channelParticipantUpdates) {
		this.setState((prevState)=> {
			const newPubData = {
				...prevState.pubData,
				discussionChannels: prevState.pubData.discussionChannels.map((channel)=> {
					return {
						...channel,
						participants: channel.participants.map((participant)=> {
							if (participant.id !== channelParticipantUpdates.discussionChannelParticipantId) { return participant; }
							return {
								...participant,
								...channelParticipantUpdates
							};
						})
					};
				})
			};
			return { pubData: newPubData };
		}, ()=> {
			apiFetch('/api/discussionChannelParticipants', {
				method: 'PUT',
				body: JSON.stringify({
					...channelParticipantUpdates,
					communityId: this.props.communityData.id,
				})
			})
			.then(()=> {
				// this.setState({ isLoading: false });
				this.props.setPubData(this.state.pubData);
			});
		});
	}

	handleChannelParticipantDelete(channelId, channelParticipantId) {
		this.setState((prevState)=> {
			const newPubData = {
				...prevState.pubData,
				discussionChannels: prevState.pubData.discussionChannels.map((channel)=> {
					return {
						...channel,
						participants: channel.participants.filter((participant)=> {
							return participant.id !== channelParticipantId;
						})
					};
				})
			};
			return { pubData: newPubData };
		}, ()=> {
			apiFetch('/api/discussionChannelParticipants', {
				method: 'DELETE',
				body: JSON.stringify({
					discussionChannelId: channelId,
					discussionChannelParticipantId: channelParticipantId,
					communityId: this.props.communityData.id,
				})
			})
			.then(()=> {
				this.props.setPubData(this.state.pubData);
			});
		});
	}

	render() {
		const pubData = this.props.pubData;
		// TODO: Only allow options on channels you moderate
		const channels = [
			{
				id: undefined,
				title: 'public',
				permissions: 'public',
				isCommunityAdminModerated: true,
				participants: [],
			},
			...pubData.discussionChannels
		];
		const channelPermissionOptions = [
			{ value: 'private', title: 'Private', description: 'Private View. Private Write' },
			{ value: 'restricted', title: 'Restricted', description: 'Public View. Private Write' },
			{ value: 'public', title: 'Public', description: 'Public View. Public Write' },
		];
		return (
			<div className="pub-options-discussions-component">
				<h1>Discussion Channels</h1>
				<form onSubmit={this.handleChannelAdd}>
					<input
						type="text"
						className="bp3-input bp3-fill"
						placeholder="New Discussion Channel Title..."
						value={this.state.newChannelTitle}
						onChange={(evt)=> {
							this.setState({ newChannelTitle: slugifyString(evt.target.value) });
						}}
					/>
				</form>

				<div className="channels">
					{channels.sort((foo, bar)=> {
						if (foo.isArchived && !bar.isArchived) { return 1; }
						if (!foo.isArchived && bar.isArchived) { return -1; }
						return 0;
					}).map((channel)=> {
						const canModerate = channel.participants.reduce((prev, curr)=> {
							if (curr.userId === this.props.loginData.id) { return true; }
							return prev;
						}, channel.isCommunityAdminModerated && this.props.loginData.isAdmin);
						if (!canModerate && channel.isArchived) { return null; }

						return (
							<div className="channel" key={`channel-${channel.id}`}>
								<div className="header">
									<div className="title">
										#<EditableText
											defaultValue={channel.title}
											onConfirm={(newTitle)=> {
												this.handleChannelUpdate({
													discussionChannelId: channel.id,
													title: slugifyString(newTitle),
												});
											}}
											disabled={!canModerate || !channel.id}
										/>
									</div>
									<div className="option">
										{!channel.id &&
											<span className="static">public</span>
										}
										{!canModerate && channel.id &&
											<span className="static">{channel.permissions}</span>
										}

										{canModerate && channel.id &&
											<Button
												text={channel.isArchived
													? 'Unarchive Channel'
													: 'Archive Channel'
												}
												onClick={()=> {
													this.handleChannelUpdate({
														discussionChannelId: channel.id,
														isArchived: !channel.isArchived,
													}, true);
												}}
												intent={channel.isArchived ? Intent.NONE : Intent.DANGER}
												minimal={true}
												loading={this.state.channelArchiveLoading === channel.id}
											/>
										}

										{/* Permissions Dropdown for channels other than #public */}
										{canModerate && channel.id && !channel.isArchived &&
											<DropdownButton
												label={channel.permissions}
												// icon={items[props.value].icon}
												isRightAligned={true}
											>
												<ul className="channel-permissions-dropdown bp3-menu">
													{channelPermissionOptions.map((option)=> {
														return (
															<li key={`permissions-${option.value}`}>
																<button
																	className="bp3-menu-item bp3-popover-dismiss"
																	onClick={()=> {
																		this.handleChannelUpdate({
																			discussionChannelId: channel.id,
																			permissions: option.value,
																		});
																	}}
																	type="button"
																>
																	<div className="title">{option.title}</div>
																	<div className="description">{option.description}</div>
																</button>
															</li>
														);
													})}
												</ul>
											</DropdownButton>
										}
									</div>
								</div>
								{!channel.isArchived &&
									<div>
										{canModerate &&
											<div className="cards-wrapper">
												{/* If community admins are not managers, show options for their permissions */}
												<PubOptionsSharingCard
													content={[
														<span className="bp3-icon-standard bp3-icon-people" />,
														<span>Community Admins</span>
													]}
													options={(
														<Checkbox
															checked={channel.isCommunityAdminModerated}
															onChange={(evt)=> {
																this.handleChannelUpdate({
																	discussionChannelId: channel.id,
																	isCommunityAdminModerated: evt.target.checked,
																});
															}}
															disabled={!channel.id}
														>
															Can Moderate
														</Checkbox>
													)}
												/>

												{/* List all version permissions, filtering out managers */}
												{channel.participants.sort((foo, bar)=> {
													if (foo.createdAt < bar.createdAt) { return -1; }
													if (foo.createdAt > bar.createdAt) { return 1; }
													return 0;
												}).map((participant)=> {
													return (
														<PubOptionsSharingCard
															key={participant.id}
															content={[
																<Avatar width={25} userInitials={participant.user.initials} userAvatar={participant.user.avatar} />,
																<span>{participant.user.fullName}</span>
															]}
															options={[
																<Checkbox
																	checked={participant.isModerator}
																	onChange={(evt)=> {
																		this.handleChannelParticipantUpdate({
																			discussionChannelParticipantId: participant.id,
																			discussionChannelId: channel.id,
																			isModerator: evt.target.checked,
																		});
																	}}
																>
																	Can Moderate
																</Checkbox>,
																<button
																	className="bp3-button bp3-minimal bp3-small"
																	type="button"
																	onClick={()=> {
																		this.handleChannelParticipantDelete(channel.id, participant.id);
																	}}
																>
																	<span className="bp3-icon-standard bp3-icon-small-cross" />
																</button>
															]}
														/>
													);
												})}

												{/* Card for adding new user to channel. Not used for #public */}
												{channel.id &&
													<PubOptionsSharingCard
														content={
															<UserAutocomplete
																onSelect={(user)=> {
																	return this.handleChannelParticipantAdd({
																		userId: user.id,
																		discussionChannelId: channel.id,
																	});
																}}
																allowCustomUser={false} // Eventually use this for emails
																placeholder={`Add participant to #${channel.title}...`}
																usedUserIds={channel.participants.map((item)=> {
																	return item.user.id;
																})}
															/>
														}
														isAddCard={true}
													/>
												}
											</div>
										}
										{!canModerate &&
											<div className="access-preview">
												{channel.isCommunityAdminModerated &&
													<Icon icon="people" />
												}
												{channel.participants.map((item)=> {
													return <Avatar width={20} userInitials={item.user.initials} userAvatar={item.user.avatar} />;
												})}
											</div>
										}
									</div>
								}
							</div>
						);
					})}
				</div>
			</div>
		);
	}
}

PubOptionsDiscussions.propTypes = propTypes;
export default PubOptionsDiscussions;
