import React, { useContext, useRef, useState } from 'react';
import useCopyToClipboard from 'react-use/lib/useCopyToClipboard';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Tooltip, Position } from '@blueprintjs/core';
import { Icon, Avatar, SharingCard, UserAutocomplete, PermissionsDropdown } from 'components';
import { apiFetch } from 'utils';
import { PageContext } from 'components/PageWrapper/PageWrapper';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	branchData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	setIsLoading: PropTypes.func,
};

const defaultProps = {
	setIsLoading: () => {},
};

const Permissions = (props) => {
	const { pubData, branchData, updateLocalData, setIsLoading } = props;
	const { communityData, locationData } = useContext(PageContext);
	const tooltipTimeout = useRef(null);
	const [showTooltip, setShowTooltip] = useState(false);
	const [copied, copyToClipboard] = useCopyToClipboard();

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

	const baseUrl = `https://${locationData.hostname}/pub/${pubData.slug}/branch/${
		pubData.activeBranch.shortId
	}`;

	const accessLinks = [
		{
			text: 'view',
			accessHash: pubData.activeBranch.viewHash,
		},
		{
			text: 'discuss',
			accessHash: pubData.activeBranch.discussHash,
		},
		{
			text: 'edit',
			accessHash: pubData.activeBranch.editHash,
		},
	];
	return (
		<div className="pub-manage_branches_permissions-component">
			<div>
				<ButtonGroup minimal={true} small={true}>
					{accessLinks.map((linkType) => {
						return (
							<Tooltip
								key={linkType.text}
								popoverClassName="bp3-dark"
								content="Copied"
								isOpen={
									showTooltip &&
									copied.value === `${baseUrl}?access=${linkType.accessHash}`
								}
								position={Position.TOP}
							>
								<Button
									onClick={() => {
										copyToClipboard(`${baseUrl}?access=${linkType.accessHash}`);
										setShowTooltip(true);
										clearTimeout(tooltipTimeout.current);
										tooltipTimeout.current = setTimeout(() => {
											setShowTooltip(false);
										}, 1500);
									}}
									text={`Anyone with this link can ${linkType.text}`}
								/>
							</Tooltip>
						);
					})}
				</ButtonGroup>
			</div>
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
							value={branchData.publicPermissions}
							onChange={(newPermission) => {
								handleBranchUpdate({
									branchId: branchData.id,
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
							value={branchData.pubManagerPermissions}
							onChange={(newPermission) => {
								handleBranchUpdate({
									branchId: branchData.id,
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
							value={branchData.communityAdminPermissions}
							onChange={(newPermission) => {
								handleBranchUpdate({
									branchId: branchData.id,
									communityAdminPermissions: newPermission,
								});
							}}
						/>
					}
				/>

				{/* Iterate and list all existing pub managers */}
				{branchData.permissions
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
										allowedTyped={['view', 'discuss', 'edit', 'manage']}
										value={permission.permissions}
										onChange={(newPermission) => {
											handleBranchPermissionUpdate({
												branchId: branchData.id,
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
												branchId: branchData.id,
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
									branchId: branchData.id,
								});
							}}
							allowCustomUser={false} // Eventually use this for emails
							placeholder="Add person..."
							usedUserIds={branchData.permissions.map((item) => {
								return item.user.id;
							})}
						/>
					}
					isAddCard={true}
				/>
			</div>
		</div>
	);
};

Permissions.propTypes = propTypes;
Permissions.defaultProps = defaultProps;
export default Permissions;
