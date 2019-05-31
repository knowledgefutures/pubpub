import React, { useContext, useRef, useState } from 'react';
import useCopyToClipboard from 'react-use/lib/useCopyToClipboard';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Button, Menu, MenuItem } from '@blueprintjs/core';
import {
	Icon,
	Avatar,
	SharingCard,
	UserAutocomplete,
	PermissionsDropdown,
	DropdownButton,
} from 'components';
import { apiFetch } from 'utils';
import { PageContext } from 'components/PageWrapper/PageWrapper';

require('./permissions.scss');

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
			<div className="dropdown-bar">
				<PermissionsDropdown
					isMinimal={true}
					prefix={
						<React.Fragment>
							<Icon icon="globe" />
							<span>Public:</span>
						</React.Fragment>
					}
					allowedTyped={
						branchData.title === 'public'
							? ['none', 'view', 'discuss']
							: ['none', 'view', 'discuss', 'edit']
					}
					isSmall={false}
					value={branchData.publicPermissions}
					onChange={(newPermission) => {
						handleBranchUpdate({
							branchId: branchData.id,
							publicPermissions: newPermission,
						});
					}}
				/>
				<PermissionsDropdown
					isMinimal={true}
					prefix={
						<React.Fragment>
							<Icon icon="id-number" />
							<span>Pub Managers:</span>
						</React.Fragment>
					}
					allowedTyped={
						branchData.title === 'public'
							? ['none', 'view', 'discuss']
							: ['none', 'view', 'discuss', 'edit', 'manage']
					}
					isSmall={false}
					value={branchData.pubManagerPermissions}
					onChange={(newPermission) => {
						handleBranchUpdate({
							branchId: branchData.id,
							pubManagerPermissions: newPermission,
						});
					}}
				/>

				<PermissionsDropdown
					isMinimal={true}
					prefix={
						<React.Fragment>
							<Icon icon="people" />
							<span>Community Admins:</span>
						</React.Fragment>
					}
					allowedTyped={
						branchData.title === 'public'
							? ['none', 'view', 'discuss']
							: ['none', 'view', 'discuss', 'edit', 'manage']
					}
					isSmall={false}
					value={branchData.communityAdminPermissions}
					onChange={(newPermission) => {
						handleBranchUpdate({
							branchId: branchData.id,
							communityAdminPermissions: newPermission,
						});
					}}
				/>
				<div className="links-dropdown">
					<DropdownButton
						isMinimal={true}
						label={
							<React.Fragment>
								<Icon icon="link" />
								<span>Sharing Links</span>
							</React.Fragment>
						}
						// icon={items[selectedKey].icon}
						isRightAligned={true}
						// isSmall={true}
						// isMinimal={props.isMinimal}
					>
						<Menu>
							{accessLinks
								.filter((linkType) => {
									/* TODO-BRANCH: */
									return (
										branchData.title !== 'public' || linkType.text !== 'edit'
									);
								})
								.map((linkType) => {
									const linkUrl = `${baseUrl}?access=${linkType.accessHash}`;
									const showCopied = showTooltip && linkUrl === copied.value;
									const confirmClasses = classNames({
										confirmable: true,
										confirmed: showCopied,
									});
									return (
										<MenuItem
											key={linkType.text}
											onClick={() => {
												copyToClipboard(linkUrl);
												setShowTooltip(true);
												clearTimeout(tooltipTimeout.current);
												tooltipTimeout.current = setTimeout(() => {
													setShowTooltip(false);
												}, 2500);
											}}
											shouldDismissPopover={false}
											text={
												<div>
													Anyone with this link can {linkType.text}
													<div className="subtext">
														Click to copy{' '}
														<span className={confirmClasses}>
															Copied!
														</span>
													</div>
												</div>
											}
										/>
									);
								})}
						</Menu>
					</DropdownButton>
				</div>
			</div>
			<div className="cards-wrapper">
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
							placeholder="Add individual user permissions..."
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
