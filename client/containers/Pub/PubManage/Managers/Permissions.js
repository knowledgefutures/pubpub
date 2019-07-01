import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox } from '@blueprintjs/core';
import { Icon, Avatar, SharingCard, UserAutocomplete } from 'components';
import { apiFetch } from 'utils';
import { PageContext } from 'components/PageWrapper/PageWrapper';

require('./permissions.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	setIsLoading: PropTypes.func,
};

const defaultProps = {
	setIsLoading: () => {},
};

const Permissions = (props) => {
	const { pubData, updateLocalData, setIsLoading } = props;
	const { communityData } = useContext(PageContext);

	const handlePubUpdate = (pubUpdates) => {
		setIsLoading(true);
		updateLocalData('pub', pubUpdates);
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
		<div className="pub-manage_managers_permissions-component">
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

Permissions.propTypes = propTypes;
Permissions.defaultProps = defaultProps;
export default Permissions;
