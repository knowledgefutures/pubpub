import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox, Spinner } from '@blueprintjs/core';
import { Icon, Avatar, SharingCard, UserAutocomplete, PermissionsDropdown, SettingsSection, InputField } from 'components';
import { apiFetch } from 'utils';

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const Branches = (props) => {
	const { pubData } = props;
	const [isLoading, setIsLoading] = useState(false);
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
					<SettingsSection title={branch.title}>
						<InputField label="Title" value={branch.title} />
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
											console.log(newPermission);
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
											console.log(newPermission);
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
											console.log(newPermission);
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
														console.log(newPermission);
													}}
												/>,
												<Button
													key={`remove-${permission.id}`}
													minimal={true}
													small={true}
													icon="small-cross"
													onClick={() => {
														// handleRemoveManager(manager.id);
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
										// onSelect={handleAddManager}
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
