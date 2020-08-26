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
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
		type: 'Community',
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
		icon: 'office',
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
		title: communityData.title,
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
		avatar: communityData.avatar,
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
		href: getDashUrl({}),
	});
	if (activeCollection) {
		scopes.push({
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			type: 'Collection',
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			icon: 'collection',
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
			title: activeCollection.title,
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
			avatar: activeCollection.avatar,
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			href: getDashUrl({
				collectionSlug: collectionSlug,
			}),
		});
	}
	if (activePub) {
		scopes.push({
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			type: 'Pub',
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			icon: 'pubDoc',
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
			title: activePub.title,
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
			avatar: activePub.avatar,
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
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
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'null'.
				buttonContent={
					<React.Fragment>
						<div className="top">{currentScopeTitle}</div>
						<div className="bottom">Dashboard</div>
					</React.Fragment>
				}
				buttonProps={{
					icon: <Icon icon={icon} />,
					// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
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
