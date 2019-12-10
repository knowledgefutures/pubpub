import React, { useContext, useState } from 'react';
import { PageContext } from 'utils/hooks';
import { MenuItem, Button, Position, Intent } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { pubDataProps } from 'types/pub';
import { apiFetch } from 'utils';
import {
	GridWrapper,
	InputField,
	PermissionsDropdown,
	Icon,
	Avatar,
	SharingCard,
	UserAutocomplete,
} from 'components';

require('./pubBranchCreate.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubBranchCreate = (props) => {
	const { pubData } = props;
	const { locationData, communityData } = useContext(PageContext);
	const [selectedBranch, setSelectedBranch] = useState(
		pubData.branches.reduce((prev, curr) => {
			if (curr.shortId === Number(locationData.query.init)) {
				return curr;
			}
			return prev;
		}, {}),
	);
	const [isLoading, setIsLoading] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [publicPermissions, setPublicPermissions] = useState('none');
	const [pubManagerPermissions, setPubManagerPermissions] = useState('none');
	const [communityAdminPermissions, setCommunityAdminPermissions] = useState('none');
	const [userPermissions, setUserPermissions] = useState([]);
	const createBranch = () => {
		setIsLoading(true);
		return apiFetch('/api/branches', {
			method: 'POST',
			body: JSON.stringify({
				title: title,
				description: description,
				publicPermissions: publicPermissions,
				pubManagerPermissions: pubManagerPermissions,
				communityAdminPermissions: communityAdminPermissions,
				userPermissions: userPermissions,
				baseBranchId: selectedBranch.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then((newBranch) => {
				window.location.href = `/pub/${pubData.slug}/branch/${newBranch.shortId}`;
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const selectBranchButtonText = selectedBranch.id
		? `Create branch from: ${selectedBranch.title}`
		: `Select a branch...`;
	return (
		<GridWrapper containerClassName="pub pub-branch-create-component">
			<h1>Create Branch</h1>
			<p>A branch is...</p>

			<Select
				activeItem={selectedBranch}
				items={pubData.branches}
				filterable={false}
				popoverProps={{ minimal: true, position: Position.BOTTOM_RIGHT }}
				onItemSelect={(item) => {
					setSelectedBranch(item);
				}}
				itemRenderer={(item, rendererProps) => {
					return (
						<MenuItem
							key={item.id}
							text={item.title}
							active={rendererProps.modifiers.active}
							onClick={rendererProps.handleClick}
						/>
					);
				}}
			>
				<Button text={selectBranchButtonText} rightIcon="caret-down" />
			</Select>

			<InputField
				label="Title"
				isRequired={true}
				value={title}
				onChange={(evt) => {
					setTitle(evt.target.value);
				}}
			/>
			<InputField
				label="Description"
				isTextarea={true}
				value={description}
				onChange={(evt) => {
					setDescription(evt.target.value);
				}}
			/>
			<InputField label="Permissions">
				<div className="dropdown-bar">
					<PermissionsDropdown
						isMinimal={true}
						prefix={
							<React.Fragment>
								<Icon icon="globe" />
								<span>Public:</span>
							</React.Fragment>
						}
						allowedTypes={['none', 'view', 'discuss', 'edit']}
						isSmall={false}
						value={publicPermissions}
						onChange={(newPermission) => {
							setPublicPermissions(newPermission);
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
						allowedTypes={['none', 'view', 'discuss', 'edit', 'manage']}
						isSmall={false}
						value={pubManagerPermissions}
						onChange={(newPermission) => {
							setPubManagerPermissions(newPermission);
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
						allowedTypes={['none', 'view', 'discuss', 'edit', 'manage']}
						isSmall={false}
						value={communityAdminPermissions}
						onChange={(newPermission) => {
							setCommunityAdminPermissions(newPermission);
						}}
					/>
				</div>
				<div className="cards-wrapper">
					{/* Iterate and list all existing pub managers */}
					{userPermissions.map((permission) => {
						return (
							<SharingCard
								key={`card-${permission.user.id}`}
								content={[
									<Avatar
										key="avatar"
										width={25}
										initials={permission.user.initials}
										avatar={permission.user.avatar}
									/>,
									<span key="name">{permission.user.fullName}</span>,
								]}
								options={[
									<PermissionsDropdown
										key={permission.id}
										allowedTypes={['view', 'discuss', 'edit', 'manage']}
										value={permission.permissions}
										onChange={(newPermission) => {
											const newUserPermissions = userPermissions.map(
												(currPermission) => {
													if (
														currPermission.user.id ===
														permission.user.id
													) {
														return {
															...currPermission,
															permissions: newPermission,
														};
													}
													return currPermission;
												},
											);
											setUserPermissions(newUserPermissions);
										}}
									/>,
									<Button
										key={`remove-${permission.id}`}
										minimal={true}
										small={true}
										icon="small-cross"
										onClick={() => {
											const newUserPermissions = userPermissions.filter(
												(currPermission) => {
													return (
														currPermission.user.id !==
														permission.user.id
													);
												},
											);
											setUserPermissions(newUserPermissions);
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
									setUserPermissions([
										...userPermissions,
										{ user: user, permissions: 'view' },
									]);
								}}
								allowCustomUser={false} // Eventually use this for emails
								placeholder="Add individual user permissions..."
								usedUserIds={userPermissions.map((item) => {
									return item.user.id;
								})}
							/>
						}
						isAddCard={true}
					/>
				</div>
			</InputField>
			<Button
				disabled={!title}
				intent={Intent.PRIMARY}
				text="Create Branch"
				onClick={createBranch}
				loading={isLoading}
			/>
		</GridWrapper>
	);
};

PubBranchCreate.propTypes = propTypes;
export default PubBranchCreate;
