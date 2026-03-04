import React, { useRef, useState } from 'react';

import { AnchorButton, Button, Intent } from '@blueprintjs/core';
import classNames from 'classnames';

import { apiFetch } from 'client/utils/apiFetch';
import { Altcha, Avatar, Honeypot, Icon } from 'components';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';

import CreateCollectionDialog from './CreateCollectionDialog';

import './breadcrumbs.scss';

type Props = {
	className?: string;
};

const Breadcrumbs = (props: Props) => {
	const { className } = props;
	const { locationData, communityData, scopeData, dashboardMenu } = usePageContext();
	const { activeTargetType, activePub, activeCollection } = scopeData.elements;
	const { activePermission } = scopeData.activePermissions;
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;
	const { mode, subMode } = dashboardMenu.activeMode!;
	const [newPubIsLoading, setNewPubIsLoading] = useState(false);
	const [newCollectionIsOpen, setNewCollectionIsOpen] = useState(false);
	const createPubAltchaRef = useRef<import('components').AltchaRef>(null);

	// console.log(locationData.path.split('/'), locationData.path.split('/').slice(-1))
	// const modesWithSubmodes = ['discussions', 'reviews', 'pages'];
	// const isParentMode = modesWithSubmodes.includes(activeMode);

	let title = communityData.title;
	let avatar = communityData.avatar;
	let showLockIcon = false;
	if (activeCollection) {
		title = activeCollection.title;
		avatar = activeCollection.avatar;
		showLockIcon = !activeCollection.isPublic;
	}
	if (activePub) {
		title = activePub.title;
		avatar = activePub.avatar;
	}

	const handleCreatePub = async (evt: React.FormEvent<HTMLFormElement>) => {
		evt.preventDefault();
		const formData = new FormData(evt.currentTarget);
		const honeypot = (formData.get('description') as string) ?? '';
		setNewPubIsLoading(true);
		try {
			const altchaPayload = await createPubAltchaRef.current?.verify();
			if (!altchaPayload) return;
			const newPub = await apiFetch.post('/api/pubs/fromForm', {
				communityId: communityData.id,
				collectionId: activeCollection && activeCollection.id,
				altcha: altchaPayload,
				_honeypot: honeypot,
			});
			window.location.href = `/pub/${newPub.slug}`;
		} finally {
			setNewPubIsLoading(false);
		}
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
				// onClick: handleCreatePub,
				minPermissions: 'manage',
			},
		],
		collection: [
			{
				text: 'Create Pub',
				// onClick: handleCreatePub,
				minPermissions: 'manage',
			},
			activeCollection && {
				text: 'Visit Collection',
				href: `/${activeCollection.slug}`,
			},
		].filter((x): x is NonNullable<typeof x> => Boolean(x)),
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
		<div className={classNames('breadcrumbs-component', className)}>
			<div className="breadcrumbs-content">
				<Avatar
					avatar={avatar}
					initials={title[0]}
					// @ts-expect-error FIXME: CommunityData does not exist on Avatar?
					communityData={communityData}
					width={40}
					isBlock={true}
				/>
				<div className="titles">
					<div className="title" title={title}>
						{title}
						{showLockIcon && <Icon icon="lock2" className="lock-icon" iconSize={20} />}
					</div>
					<div className="crumbs">
						<a className="crumb truncate" href={getDashUrl({})}>
							<Icon icon="office" iconSize={10} />
							<span className="bottom-text">{communityData.title}</span>
						</a>
						{activeCollection && (
							<React.Fragment>
								<Icon icon="chevron-right" className="crumb-icon" iconSize={12} />
								<a className="crumb truncate" href={getDashUrl({ collectionSlug })}>
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
										collectionSlug,
										pubSlug,
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
										collectionSlug,
										pubSlug,
										mode,
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
										collectionSlug,
										pubSlug,
										mode,
										subMode,
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
								activePermission as string,
							);
							const minPermissionsIndex =
								'minPermissions' in action && action.minPermissions
									? permissionValues.indexOf(action.minPermissions)
									: -1;
							return activePermissionIndex >= minPermissionsIndex;
						})
						.map((action) => {
							const buttonsProps = {
								key: action.text,
								text: action.text,
								intent: Intent.PRIMARY,
								...('onClick' in action && { onClick: action.onClick }),
								...('href' in action && { href: action.href }),
								loading: action.text === 'Create Pub' && newPubIsLoading,
								disabled: action.text !== 'Create Pub' && newPubIsLoading,
								outlined: true,
							};
							if (action.text === 'Create Pub') {
								const { onClick: _, ...buttonProps } = buttonsProps;
								return (
									<form
										key={action.text}
										onSubmit={handleCreatePub}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '10px',
										}}
									>
										<Altcha ref={createPubAltchaRef} />
										<Honeypot name="description" />
										<Button {...buttonProps} type="submit" />
									</form>
								);
							}

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
