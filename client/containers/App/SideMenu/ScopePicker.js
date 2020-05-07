import React from 'react';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';
import { Icon, MenuButton, ScopeDropdown } from 'components';

require('./scopePicker.scss');

const ScopePicker = () => {
	const { locationData, communityData, scopeData } = usePageContext();
	const { activeCollection, activePub } = scopeData.elements;

	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;

	let currentScopeTitle = 'Community';
	let icon = 'office';
	if (activeCollection) {
		currentScopeTitle = 'Collection';
		icon = 'collection';
	}
	if (activePub) {
		currentScopeTitle = 'Pub';
		icon = 'pubDoc';
	}

	const scopes = [];
	scopes.push({
		type: 'Community',
		icon: 'office',
		title: communityData.title,
		avatar: communityData.avatar,
		href: getDashUrl({}),
	});
	if (activeCollection) {
		scopes.push({
			type: 'Collection',
			icon: 'collection',
			title: activeCollection.title,
			avatar: activeCollection.avatar,
			href: getDashUrl({
				collectionSlug: collectionSlug,
			}),
		});
	}
	if (activePub) {
		scopes.push({
			type: 'Pub',
			icon: 'pubDoc',
			title: activePub.title,
			avatar: activePub.avatar,
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
			}),
		});
	}

	return (
		<div className="scope-picker-component">
			<MenuButton
				aria-label="Dashboard Menu"
				buttonContent={
					<React.Fragment>
						<div className="top">{currentScopeTitle}</div>
						<div className="bottom">Dashboard</div>
					</React.Fragment>
				}
				buttonProps={{
					icon: <Icon icon={icon} />,
					className: 'scope-button',
					fill: true,
					minimal: true,
					rightIcon: 'caret-down',
				}}
				placement="bottom-start"
				className="scope-menu"
			>
				<ScopeDropdown />
			</MenuButton>
		</div>
	);
};

export default ScopePicker;
