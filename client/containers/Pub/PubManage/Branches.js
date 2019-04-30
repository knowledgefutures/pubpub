import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Spinner } from '@blueprintjs/core';
import {
	Icon,
	Avatar,
	SharingCard,
	UserAutocomplete,
	PermissionsDropdown,
	SettingsSection,
	InputField,
} from 'components';
import { apiFetch, slugifyString } from 'utils';

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const Branches = (props) => {
	const { pubData, updateLocalData, communityData } = props;
	const [isLoading, setIsLoading] = useState(false);
	const handleBranchUpdate = (branchUpdates) => {
		setIsLoading(true);
		updateLocalData('pub', {
			...pubData,
			branches: pubData.branches.map((branch) => {
				if (branch.id !== branchUpdates.branchId) {
					return branch;
				}
				return {
					...branch,
					...branchUpdates,
				};
			}),
		});
		return apiFetch('/api/branches', {
			method: 'PUT',
			body: JSON.stringify({
				...branchUpdates,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				setIsLoading(false);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const handleBranchPermissionAdd = (newBranchPermission) => {
		setIsLoading(true);
		return apiFetch('/api/branchPermissions', {
			method: 'POST',
			body: JSON.stringify({
				...newBranchPermission,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then((branchPermissionData) => {
				updateLocalData('pub', {
					...pubData,
					branches: pubData.branches.map((branch) => {
						if (branch.id !== newBranchPermission.branchId) {
							return branch;
						}
						return {
							...branch,
							permissions: [...branch.permissions, branchPermissionData],
						};
					}),
				});
				setIsLoading(false);
			})
			.catch((err) => {
				console.error(err);
			});
	};
	const handleBranchPermissionUpdate = (updatedBranchPermission) => {
		setIsLoading(true);
		updateLocalData('pub', {
			...pubData,
			branches: pubData.branches.map((branch) => {
				if (branch.id !== updatedBranchPermission.branchId) {
					return branch;
				}
				return {
					...branch,
					permissions: branch.permissions.map((branchPermission) => {
						if (branchPermission.id !== updatedBranchPermission.branchPermissionId) {
							return branchPermission;
						}
						return {
							...branchPermission,
							...updatedBranchPermission,
						};
					}),
				};
			}),
		});
		return apiFetch('/api/branchPermissions', {
			method: 'PUT',
			body: JSON.stringify({
				...updatedBranchPermission,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				setIsLoading(false);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const handleBranchPermissionDelete = (updatedBranchPermission) => {
		setIsLoading(true);
		updateLocalData('pub', {
			...pubData,
			branches: pubData.branches.map((branch) => {
				if (branch.id !== updatedBranchPermission.branchId) {
					return branch;
				}
				return {
					...branch,
					permissions: branch.permissions.filter((branchPermission) => {
						return branchPermission.id !== updatedBranchPermission.branchPermissionId;
					}),
				};
			}),
		});
		return apiFetch('/api/branchPermissions', {
			method: 'DELETE',
			body: JSON.stringify({
				...updatedBranchPermission,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				setIsLoading(false);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	return (
		<div className="pub-manage_branches-component">
			{isLoading && (
				<div className="save-wrapper">
					<Spinner size={Spinner.SIZE_SMALL} /> Saving...
				</div>
			)}
			<h2>Branches</h2>
			<p>Branches are different forks of the document within a single pub.</p>

			{pubData.branches.map((branch) => {
				return (
					<SettingsSection title={branch.title} key={branch.id}>
						<InputField
							label="Title"
							value={branch.title}
							onChange={(evt) => {
								handleBranchUpdate({
									branchId: branch.id,
									title: slugifyString(evt.target.value),
								});
							}}
						/>
						<p>Permissions</p>
						<div className="cards-wrapper">
							{/* Public Permissions */}
							<SharingCard
								content={[
									<Icon key="icon" icon="globe" iconSize={20} />,
									<span key="title">Public</span>,
								]}
								options={
									<PermissionsDropdown
										allowedTyped={['none', 'view', 'discuss', 'edit']}
										value={branch.publicPermissions}
										onChange={(newPermission) => {
											handleBranchUpdate({
												branchId: branch.id,
												publicPermissions: newPermission,
											});
										}}
									/>
								}
							/>

							{/* Pub Manager Permissions */}
							<SharingCard
								content={[
									<Icon key="icon" icon="id-number" iconSize={20} />,
									<span key="title">Pub Managers</span>,
								]}
								options={
									<PermissionsDropdown
										allowedTyped={['none', 'view', 'discuss', 'edit', 'manage']}
										value={branch.pubManagerPermissions}
										onChange={(newPermission) => {
											handleBranchUpdate({
												branchId: branch.id,
												pubManagerPermissions: newPermission,
											});
										}}
									/>
								}
							/>

							{/* Community Admin Permissions */}
							<SharingCard
								content={[
									<Icon key="icon" icon="people" iconSize={20} />,
									<span key="title">Community Admins</span>,
								]}
								options={
									<PermissionsDropdown
										allowedTyped={['none', 'view', 'discuss', 'edit', 'manage']}
										value={branch.communityAdminPermissions}
										onChange={(newPermission) => {
											handleBranchUpdate({
												branchId: branch.id,
												communityAdminPermissions: newPermission,
											});
										}}
									/>
								}
							/>

							{/* Iterate and list all existing pub managers */}
							{branch.permissions
								.sort((foo, bar) => {
									if (foo.createdAt < bar.createdAt) {
										return -1;
									}
									if (foo.createdAt > bar.createdAt) {
										return 1;
									}
									return 0;
								})
								.map((permission) => {
									return (
										<SharingCard
											key={`card-${permission.id}`}
											content={[
												<Avatar
													key="avatar"
													width={25}
													userInitials={permission.user.initials}
													userAvatar={permission.user.avatar}
												/>,
												<span key="name">{permission.user.fullName}</span>,
											]}
											options={[
												<PermissionsDropdown
													key={permission.id}
													allowedTyped={[
														'view',
														'discuss',
														'edit',
														'manage',
													]}
													value={permission.permissions}
													onChange={(newPermission) => {
														handleBranchPermissionUpdate({
															branchId: branch.id,
															branchPermissionId: permission.id,
															permissions: newPermission,
														});
													}}
												/>,
												<Button
													key={`remove-${permission.id}`}
													minimal={true}
													small={true}
													icon="small-cross"
													onClick={() => {
														handleBranchPermissionDelete({
															branchId: branch.id,
															branchPermissionId: permission.id,
														});
													}}
												/>,
											]}
										/>
									);
								})}

							{/* Input card for adding new permission */}
							<SharingCard
								content={
									<UserAutocomplete
										onSelect={(user) => {
											handleBranchPermissionAdd({
												userId: user.id,
												branchId: branch.id,
											});
										}}
										allowCustomUser={false} // Eventually use this for emails
										placeholder="Add person..."
										usedUserIds={branch.permissions.map((item) => {
											return item.user.id;
										})}
									/>
								}
								isAddCard={true}
							/>
						</div>
					</SettingsSection>
				);
			})}
		</div>
	);
};

Branches.propTypes = propTypes;
export default Branches;
