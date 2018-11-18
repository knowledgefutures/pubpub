import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { Checkbox, Spinner } from '@blueprintjs/core';
import UserAutocomplete from 'components/UserAutocomplete/UserAutocomplete';
import Icon from 'components/Icon/Icon';
import PubOptionsSharingDropdownPrivacy from 'components/PubOptionsSharingDropdownPrivacy/PubOptionsSharingDropdownPrivacy';
import PubOptionsSharingDropdownPermissions from 'components/PubOptionsSharingDropdownPermissions/PubOptionsSharingDropdownPermissions';
import PubOptionsSharingCard from 'components/PubOptionsSharingCard/PubOptionsSharingCard';
import Avatar from 'components/Avatar/Avatar';
import { apiFetch } from 'utilities';

require('./pubOptionsSharing.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};

class PubOptionsSharing extends Component {
	constructor(props) {
		super(props);
		this.state = {
			/* We store pubData in state of this component so we can do immediate */
			/* updates and save in the background without jumpy effects */
			pubData: this.props.pubData,
			isLoading: false,
			activePermissionsVersion: 'draft',
		};
		this.handleAddManager = this.handleAddManager.bind(this);
		this.handleRemoveManager = this.handleRemoveManager.bind(this);
		this.handleVersionUpdate = this.handleVersionUpdate.bind(this);
		this.handlePubUpdate = this.handlePubUpdate.bind(this);
		this.handleVersionPermissionAdd = this.handleVersionPermissionAdd.bind(this);
		this.handleVersionPermissionUpdate = this.handleVersionPermissionUpdate.bind(this);
		this.handleVersionPermissionDelete = this.handleVersionPermissionDelete.bind(this);
	}

	handleAddManager(user) {
		return apiFetch('/api/pubManagers', {
			method: 'POST',
			body: JSON.stringify({
				userId: user.id,
				pubId: this.state.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setState((prevState)=> {
				const newPubData = {
					...prevState.pubData,
					managers: [
						...prevState.pubData.managers,
						result,
					]
				};
				this.props.setPubData(newPubData);
				return { pubData: newPubData };
			});
		});
	}

	handleRemoveManager(managerId) {
		this.setState((prevState)=> {
			const newPubData = {
				...prevState.pubData,
				managers: prevState.pubData.managers.filter((manager)=> {
					return manager.id !== managerId;
				})
			};
			return { pubData: newPubData, isLoading: true };
		}, ()=> {
			apiFetch('/api/pubManagers', {
				method: 'DELETE',
				body: JSON.stringify({
					pubManagerId: managerId,
					pubId: this.state.pubData.id,
					communityId: this.props.communityData.id,
				})
			})
			.then(()=> {
				this.props.setPubData(this.state.pubData);
				this.setState({ isLoading: false });
			});
		});
	}

	handleVersionUpdate(versionUpdates) {
		this.setState((prevState)=> {
			const newPubData = {
				...prevState.pubData,
				versions: prevState.pubData.versions.map((version)=> {
					if (version.id !== versionUpdates.versionId) { return version; }
					return {
						...version,
						...versionUpdates,
					};
				})
			};
			return { pubData: newPubData, isLoading: true };
		}, ()=> {
			apiFetch('/api/versions', {
				method: 'PUT',
				body: JSON.stringify({
					...versionUpdates,
					pubId: this.state.pubData.id,
					communityId: this.props.communityData.id,
				})
			})
			.then(()=> {
				this.props.setPubData(this.state.pubData);
				this.setState({ isLoading: false });
			});
		});
	}

	handlePubUpdate(pubUpdates) {
		this.setState((prevState)=> {
			const newPubData = {
				...prevState.pubData,
				...pubUpdates,
			};
			return { pubData: newPubData, isLoading: true };
		}, ()=> {
			apiFetch('/api/pubs', {
				method: 'PUT',
				body: JSON.stringify({
					...pubUpdates,
					pubId: this.state.pubData.id,
					communityId: this.props.communityData.id,
				})
			})
			.then(()=> {
				this.props.setPubData(this.state.pubData);
				this.setState({ isLoading: false });
			});
		});
	}

	handleVersionPermissionAdd(newVersionPermission) {
		return apiFetch('/api/versionPermissions', {
			method: 'POST',
			body: JSON.stringify({
				...newVersionPermission,
				pubId: this.state.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setState((prevState)=> {
				const newPubData = {
					...prevState.pubData,
					versionPermissions: [
						...prevState.pubData.versionPermissions,
						result,
					]
				};
				this.props.setPubData(newPubData);
				return { pubData: newPubData };
			});
		});
	}

	handleVersionPermissionUpdate(versionPermissionUpdates) {
		this.setState((prevState)=> {
			const newPubData = {
				...prevState.pubData,
				versionPermissions: prevState.pubData.versionPermissions.map((versionPermission)=> {
					if (versionPermission.id !== versionPermissionUpdates.versionPermissionId) { return versionPermission; }
					return {
						...versionPermission,
						...versionPermissionUpdates,
					};
				})
			};
			return { pubData: newPubData, isLoading: true };
		}, ()=> {
			apiFetch('/api/versionPermissions', {
				method: 'PUT',
				body: JSON.stringify({
					...versionPermissionUpdates,
					pubId: this.state.pubData.id,
					communityId: this.props.communityData.id,
				})
			})
			.then(()=> {
				this.setState({ isLoading: false });
				this.props.setPubData(this.state.pubData);
			});
		});
	}

	handleVersionPermissionDelete(versionPermissionId) {
		this.setState((prevState)=> {
			const newPubData = {
				...prevState.pubData,
				versionPermissions: prevState.pubData.versionPermissions.filter((versionPermission)=> {
					return versionPermission.id !== versionPermissionId;
				})
			};
			return { pubData: newPubData, isLoading: true };
		}, ()=> {
			apiFetch('/api/versionPermissions', {
				method: 'DELETE',
				body: JSON.stringify({
					versionPermissionId: versionPermissionId,
					pubId: this.state.pubData.id,
					communityId: this.props.communityData.id,
				})
			})
			.then(()=> {
				this.setState({ isLoading: false });
				this.props.setPubData(this.state.pubData);
			});
		});
	}

	render() {
		const pubData = this.state.pubData;
		const managers = pubData.managers;
		const managerIds = {};
		managers.forEach((manager)=> {
			managerIds[manager.user.id] = true;
		});
		const defaultPublicVersionId = pubData.versions.sort((foo, bar)=> {
			if (foo.createdAt > bar.createdAt) { return -1; }
			if (foo.createdAt < bar.createdAt) { return 1; }
			return 0;
		}).reduce((prev, curr)=> {
			if (!prev && curr.isPublic) { return curr.id; }
			return prev;
		}, undefined);

		const sortedVersions = pubData.versions.sort((foo, bar)=> {
			if (foo.createdAt < bar.createdAt) { return 1; }
			if (foo.createdAt > bar.createdAt) { return -1; }
			return 0;
		});
		const versionBlockItems = [
			{}, // Draft placeholder. Absence of item.id indicates it's draft when rendering
			...sortedVersions,
		];
		return (
			<div className="pub-options-sharing-component">
				<div>
					{this.state.isLoading &&
						<div className="save-wrapper">
							<Spinner small={true} /> Saving...
						</div>
					}
					<h1>Sharing</h1>
					<h2>Managers</h2>
					<p>Managers can view all versions, edit pub details, and edit the draft.</p>

					<div className="cards-wrapper">
						{/* Dedicated card for Community Admin manager permissions */}
						<PubOptionsSharingCard
							content={[
								<span className="pt-icon-standard pt-icon-people" />,
								<span>Community Admins</span>
							]}
							options={
								<Checkbox
									checked={pubData.isCommunityAdminManaged}
									onChange={(evt)=> {
										this.handlePubUpdate({
											isCommunityAdminManaged: evt.target.checked,
										});
									}}
								>
									Can Manage
								</Checkbox>
							}
						/>

						{/* Iterate and list all existing pub managers */}
						{managers.sort((foo, bar)=> {
							if (foo.createdAt < bar.createdAt) { return -1; }
							if (foo.createdAt > bar.createdAt) { return 1; }
							return 0;
						}).map((manager)=> {
							return (
								<PubOptionsSharingCard
									key={`card-${manager.id}`}
									content={[
										<Avatar width={25} userInitials={manager.user.initials} userAvatar={manager.user.avatar} />,
										<span>{manager.user.fullName}</span>
									]}
									options={managers.length > 1
										? <button
											className="pt-button pt-minimal pt-small pt-icon-small-cross"
											type="button"
											onClick={()=> {
												this.handleRemoveManager(manager.id);
											}}
										/>
										: null
									}
								/>
							);
						})}

						{/* Input card for adding new manager */}
						<PubOptionsSharingCard
							content={
								<UserAutocomplete
									onSelect={this.handleAddManager}
									allowCustomUser={false} // Eventually use this for emails
									placeholder="Add manager..."
									usedUserIds={managers.map((item)=> {
										return item.user.id;
									})}
								/>
							}
							isAddCard={true}
						/>
					</div>

					<h2>Version Permissions</h2>

					{/* Iterate and list options for all versions including working draft */}
					{versionBlockItems.map((version)=> {
						const isDraft = !version.id;
						const isActive = isDraft
							? this.state.activePermissionsVersion === 'draft'
							: this.state.activePermissionsVersion === version.id;
						const savedVersionPrivacy = version.isPublic ? 'publicView' : 'private';
						const currentPrivacy = isDraft
							? pubData.draftPermissions
							: savedVersionPrivacy;
						const communityAdminsHavePermission = isDraft
							? pubData.isCommunityAdminManaged || pubData.communityAdminDraftPermissions !== 'none'
							: pubData.isCommunityAdminManaged || version.isCommunityAdminShared;
						const showPreviewAcess = isDraft
							? this.state.activePermissionsVersion !== 'draft' && pubData.draftPermissions !== 'publicEdit'
							: !isActive && !version.isPublic;
						const privacyTitle = isDraft
							? currentPrivacy.replace('public', 'Public ').replace('private', 'Private')
							: currentPrivacy.replace('public', 'Public').replace('private', 'Private').replace('Edit', '').replace('View', '');
						const communityAdminsHaveFullAccess = pubData.isCommunityAdminManaged;

						return (
							<div
								className={`version-block ${isActive ? 'active' : ''}`}
								onClick={()=> {
									this.setState({ activePermissionsVersion: version.id || 'draft' });
								}}
								role="button"
								tabIndex="-1"
							>
								<div className="header">
									<div className="title">
										<b>{isDraft ? 'Working Draft' : dateFormat(version.createdAt, 'mmm dd, yyyy · h:MMTT')}</b>
										<span>{version.description}</span>
									</div>
									<div className="privacy">
										{/* If isActive version block, show dropdown button with options */}
										{isActive &&
											<PubOptionsSharingDropdownPrivacy
												value={currentPrivacy}
												isDraft={isDraft}
												onChange={(newValue)=> {
													if (isDraft) {
														this.handlePubUpdate({
															draftPermissions: newValue
														});
													} else {
														this.handleVersionUpdate({
															versionId: version.id,
															isPublic: newValue === 'public'
														});
													}
												}}
											/>
										}

										{/* If collapsed block and defaultPublicVersion, show message */}
										{!isActive && !isDraft && version.id === defaultPublicVersionId &&
											<span>(Default Public Version) </span>
										}

										{/* If collapsed block, show privacy status */}
										{!isActive &&
											<span>
												{currentPrivacy === 'private' &&
													<Icon icon="lock2" />
												}
												<span>{privacyTitle}</span>
											</span>
										}
									</div>
								</div>

								{/* Preview who has access when the version block is collapsed */}
								{showPreviewAcess &&
									<div className="access-preview">
										{communityAdminsHavePermission &&
											<span className="pt-icon-standard pt-icon-people" />
										}
										{pubData.managers.concat(pubData.versionPermissions.filter((versionPermission)=> {
											return !managerIds[versionPermission.user.id];
										}).filter((versionPermission)=> {
											return isDraft
												? !versionPermission.versionId
												: versionPermission.versionId === version.id;
										})).map((item)=> {
											return <Avatar width={20} userInitials={item.user.initials} userAvatar={item.user.avatar} />;
										})}
									</div>
								}

								{/* Expanded permissions view */}
								{isActive &&
									<div>
										<div>Permissions</div>
										<div className="cards-wrapper">
											{/* Card deailing who has access due to manager status */}
											<PubOptionsSharingCard
												content={[
													<span>Managers</span>,
													<span className="managers-preview">
														{communityAdminsHaveFullAccess &&
															<span className="pt-icon-standard pt-icon-people" />
														}
														{managers.slice(0, 2).map((manager)=> {
															return <Avatar width={20} userInitials={manager.user.initials} userAvatar={manager.user.avatar} />;
														})}
														{managers.length - 2 > 0 &&
															<Avatar width={20} userInitials={`+${managers.length - 2}`} />
														}
													</span>
												]}
												options={
													<span>{isDraft ? 'Can Edit' : 'Can View'}</span>
												}
												isFlatCard={true}
											/>

											{/* If community admins are not managers, show options for their permissions */}
											{!pubData.isCommunityAdminManaged &&
												<PubOptionsSharingCard
													content={[
														<span className="pt-icon-standard pt-icon-people" />,
														<span>Community Admins</span>
													]}
													options={isDraft
														? <PubOptionsSharingDropdownPermissions
															value={pubData.communityAdminDraftPermissions}
															onChange={(newValue)=> {
																this.handlePubUpdate({
																	communityAdminDraftPermissions: newValue,
																});
															}}
														/>
														: (
															<Checkbox
																checked={version.isCommunityAdminShared}
																onChange={(evt)=> {
																	this.handleVersionUpdate({
																		versionId: version.id,
																		isCommunityAdminShared: evt.target.checked,
																	});
																}}
															>
																Can View
															</Checkbox>
														)
													}
												/>
											}

											{/* List all version permissions, filtering out managers */}
											{pubData.versionPermissions.filter((versionPermission)=> {
												return !managerIds[versionPermission.user.id];
											}).filter((versionPermission)=> {
												return isDraft
													? !versionPermission.versionId
													: versionPermission.versionId === version.id;
											}).sort((foo, bar)=> {
												if (foo.createdAt < bar.createdAt) { return -1; }
												if (foo.createdAt > bar.createdAt) { return 1; }
												return 0;
											}).map((versionPermission)=> {
												return (
													<PubOptionsSharingCard
														key={versionPermission.id}
														content={[
															<Avatar width={25} userInitials={versionPermission.user.initials} userAvatar={versionPermission.user.avatar} />,
															<span>{versionPermission.user.fullName}</span>
														]}
														options={[
															isDraft
																? (
																	<PubOptionsSharingDropdownPermissions
																		value={versionPermission.permissions}
																		hideNone={true}
																		onChange={(newValue)=> {
																			this.handleVersionPermissionUpdate({
																				versionPermissionId: versionPermission.id,
																				permissions: newValue,
																			});
																		}}
																	/>
																)
																: null,
															<button
																className="pt-button pt-minimal pt-small"
																type="button"
																onClick={()=> {
																	this.handleVersionPermissionDelete(versionPermission.id || null);
																}}
															>
																<span className="pt-icon-standard pt-icon-small-cross" />
															</button>
														]}
													/>
												);
											})}

											{/* Card for adding new user to version permissions */}
											<PubOptionsSharingCard
												content={
													<UserAutocomplete
														onSelect={(user)=> {
															return this.handleVersionPermissionAdd({
																userId: user.id,
																versionId: isDraft ? null : version.id,
															});
														}}
														allowCustomUser={false} // Eventually use this for emails
														placeholder="Add user..."
														usedUserIds={pubData.versionPermissions.filter((versionPermission)=> {
															return !versionPermission.versionId;
														}).map((item)=> {
															return item.user.id;
														}).concat(pubData.managers.map((item)=> {
															return item.user.id;
														}))}
													/>
												}
												isAddCard={true}
											/>
										</div>

										<div>Sharing Links</div>
										{isDraft && [
											<div><a href={`${window.location.origin}/pub/${pubData.slug}/draft?access=${pubData.draftViewHash}`}>Anyone with this link can view</a></div>,
											<div><a href={`${window.location.origin}/pub/${pubData.slug}/draft?access=${pubData.draftEditHash}`}>Anyone with this link can edit</a></div>
										]}
										{!isDraft &&
											<a href={`${window.location.origin}/pub/${pubData.slug}?version=${version.id}&access=${version.viewHash}`}>Anyone with this link can view</a>
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

PubOptionsSharing.propTypes = propTypes;
export default PubOptionsSharing;
