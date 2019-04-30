import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox, Spinner } from '@blueprintjs/core';
import { Icon, Avatar, SharingCard, UserAutocomplete } from 'components';
import { apiFetch } from 'utils';

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const Managers = (props) => {
	const { pubData, communityData, updateLocalData } = props;
	const [isLoading, setIsLoading] = useState(false);
	const handlePubUpdate = (pubUpdates) => {
		setIsLoading(true);
		updateLocalData('pub', {
			...pubData,
			...pubUpdates,
		});
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				...pubUpdates,
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

	const handleAddManager = (user) => {
		setIsLoading(true);
		return apiFetch('/api/pubManagers', {
			method: 'POST',
			body: JSON.stringify({
				userId: user.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then((result) => {
				const newPubData = {
					...pubData,
					managers: [...pubData.managers, result],
				};
				updateLocalData('pub', newPubData);
				setIsLoading(false);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const handleRemoveManager = (managerId) => {
		setIsLoading(true);
		updateLocalData('pub', {
			...pubData,
			managers: pubData.managers.filter((manager) => {
				return manager.id !== managerId;
			}),
		});
		apiFetch('/api/pubManagers', {
			method: 'DELETE',
			body: JSON.stringify({
				pubManagerId: managerId,
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
		<div className="pub-manage_managers-component">
			{isLoading && (
				<div className="save-wrapper">
					<Spinner size={Spinner.SIZE_SMALL} /> Saving...
				</div>
			)}
			<h2>Managers</h2>
			<p>Pub managers can edit pub details and add other managers.</p>
			<div className="cards-wrapper">
				{/* Dedicated card for Community Admin manager permissions */}
				<SharingCard
					content={[
						<Icon key="icon" icon="people" />,
						// <span className="bp3-icon-standard bp3-icon-people" />,
						<span key="name">Community Admins</span>,
					]}
					options={
						<Checkbox
							checked={pubData.isCommunityAdminManaged}
							onChange={(evt) => {
								handlePubUpdate({
									isCommunityAdminManaged: evt.target.checked,
								});
							}}
						>
							Can Manage
						</Checkbox>
					}
				/>

				{/* Iterate and list all existing pub managers */}
				{pubData.managers
					.sort((foo, bar) => {
						if (foo.createdAt < bar.createdAt) {
							return -1;
						}
						if (foo.createdAt > bar.createdAt) {
							return 1;
						}
						return 0;
					})
					.map((manager) => {
						return (
							<SharingCard
								key={`card-${manager.id}`}
								content={[
									<Avatar
										key="avatar"
										width={25}
										userInitials={manager.user.initials}
										userAvatar={manager.user.avatar}
									/>,
									<span key="name">{manager.user.fullName}</span>,
								]}
								options={
									pubData.managers.length > 1 ? (
										<Button
											minimal={true}
											small={true}
											icon="small-cross"
											onClick={() => {
												handleRemoveManager(manager.id);
											}}
										/>
									) : null
								}
							/>
						);
					})}

				{/* Input card for adding new manager */}
				<SharingCard
					content={
						<UserAutocomplete
							onSelect={handleAddManager}
							allowCustomUser={false} // Eventually use this for emails
							placeholder="Add manager..."
							usedUserIds={pubData.managers.map((item) => {
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

Managers.propTypes = propTypes;
export default Managers;
