import React, { useState } from 'react';
import { AnchorButton, Button, Intent } from '@blueprintjs/core';

import { Avatar, Icon } from 'components';
import { usePageContext } from 'utils/hooks';
import { getDashUrl, getDashboardModes } from 'utils/dashboard';
import { apiFetch } from 'client/utils/apiFetch';

import CreateCollectionDialog from './CreateCollectionDialog';

require('./breadcrumbs.scss');

const Breadcrumbs = () => {
	const { locationData, communityData, scopeData } = usePageContext();
	const { activeTargetType, activePub, activeCollection } = scopeData.elements;
	const { activePermission } = scopeData.activePermissions;
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;
	const { mode, subMode } = getDashboardModes(locationData);
	const [newPubIsLoading, setNewPubIsLoading] = useState(false);
	const [newCollectionIsOpen, setNewCollectionIsOpen] = useState(false);

	// console.log(locationData.path.split('/'), locationData.path.split('/').slice(-1))
	// const modesWithSubmodes = ['discussions', 'reviews', 'pages'];
	// const isParentMode = modesWithSubmodes.includes(activeMode);

	let title = communityData.title;
	let avatar = communityData.avatar;
	if (activeCollection) {
		title = activeCollection.title;
		avatar = activeCollection.avatar;
	}
	if (activePub) {
		title = activePub.title;
		avatar = activePub.avatar;
	}

	const handleCreatePub = () => {
		setNewPubIsLoading(true);
		return apiFetch('/api/pubs', {
			method: 'POST',
			body: JSON.stringify({
				communityId: communityData.id,
				defaultCollectionIds: activeCollection ? [activeCollection.id] : [],
			}),
		})
			.then((newPub) => {
				window.location.href = `/pub/${newPub.slug}`;
			})
			.catch((err) => {
				console.error(err);
				setNewPubIsLoading(false);
			});
	};

	const actions = {
		community: [
			{
				text: 'Create Collection',
				onClick: () => {
					setNewCollectionIsOpen(true);
				},
				minPermissions: 'manage',
			},
			{
				text: 'Create Pub',
				onClick: handleCreatePub,
				minPermissions: 'manage',
			},
		],
		collection: [
			{
				text: 'Create Pub',
				onClick: handleCreatePub,
				minPermissions: 'manage',
			},
		],
		pub: [
			{
				text: 'Go to Pub',
				href: activePub
					? `/pub/${activePub.slug}${
							activeCollection ? `?collectionSlug=${activeCollection.slug}` : ''
					  }`
					: undefined,
			},
		],
	};

	return (
		<div className="breadcrumbs-component">
			<div className="breadcrumbs-content">
				<Avatar
					avatar={avatar}
					initials={title[0]}
					communityData={communityData}
					width={40}
					isBlock={true}
				/>
				<div className="titles">
					<div className="title" title={title}>
						{title}
					</div>
					<div className="crumbs">
						<a className="crumb truncate" href={getDashUrl({})}>
							<Icon icon="office" iconSize={10} />
							<span className="bottom-text">{communityData.title}</span>
						</a>
						{activeCollection && (
							<React.Fragment>
								<Icon icon="chevron-right" className="crumb-icon" iconSize={12} />
								<a
									className="crumb truncate"
									href={getDashUrl({ collectionSlug: collectionSlug })}
								>
									<Icon icon="collection" iconSize={10} />
									<span className="bottom-text">{activeCollection.title}</span>
								</a>
							</React.Fragment>
						)}

						{activePub && (
							<React.Fragment>
								<Icon icon="chevron-right" className="crumb-icon" iconSize={12} />
								<a
									className="crumb truncate"
									href={getDashUrl({
										collectionSlug: collectionSlug,
										pubSlug: pubSlug,
									})}
								>
									<Icon icon="pubDoc" iconSize={10} />
									<span className="bottom-text">{activePub.title}</span>
								</a>
							</React.Fragment>
						)}
						{mode && (
							<React.Fragment>
								<Icon icon="chevron-right" className="crumb-icon" iconSize={12} />
								<a
									className="crumb capitalize no-shrink"
									href={getDashUrl({
										collectionSlug: collectionSlug,
										pubSlug: pubSlug,
										mode: mode,
										// subMode: isParentMode ? 'list' : undefined,
									})}
								>
									{mode}
								</a>
							</React.Fragment>
						)}
						{subMode && (
							<React.Fragment>
								<Icon icon="chevron-right" className="crumb-icon" iconSize={12} />
								<a
									className="crumb no-shrink capitalize"
									href={getDashUrl({
										collectionSlug: collectionSlug,
										pubSlug: pubSlug,
										mode: mode,
										subMode: subMode,
									})}
								>
									{subMode}
								</a>
							</React.Fragment>
						)}
					</div>
				</div>
				<div className="breadcrumb-actions">
					{actions[activeTargetType]
						.filter((action) => {
							const permissionValues = ['view', 'edit', 'manage', 'admin'];
							const activePermissionIndex = permissionValues.indexOf(
								activePermission,
							);
							const minPermissionsIndex = permissionValues.indexOf(
								action.minPermissions,
							);
							return activePermissionIndex >= minPermissionsIndex;
						})
						.map((action) => {
							const buttonsProps = {
								key: action.text,
								text: action.text,
								intent: Intent.PRIMARY,
								onClick: action.onClick,
								href: action.href,
								loading: action.text === 'Create Pub' && newPubIsLoading,
								disabled: action.text !== 'Create Pub' && newPubIsLoading,
								outlined: true,
							};
							return buttonsProps.href ? (
								<AnchorButton {...buttonsProps} />
							) : (
								<Button {...buttonsProps} />
							);
						})}
				</div>
			</div>
			<CreateCollectionDialog
				isOpen={newCollectionIsOpen}
				onClose={() => {
					setNewCollectionIsOpen(false);
				}}
			/>
		</div>
	);
};

export default Breadcrumbs;
