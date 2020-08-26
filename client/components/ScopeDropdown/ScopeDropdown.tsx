import React from 'react';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';
import { Avatar, Icon, MenuItem } from 'components';

require('./scopeDropdown.scss');

const ScopeDropdown = () => {
	const { locationData, communityData, scopeData } = usePageContext();
	const { activeCollection, activePub } = scopeData.elements;

	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;

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
		<div className="scope-dropdown-component">
			<div className="intro">Select Scope:</div>
			<div className="scopes">
				{scopes.map((scope, index) => {
					return (
						<MenuItem
							// @ts-expect-error ts-migrate(2322) FIXME: Property 'href' does not exist on type 'IntrinsicA... Remove this comment to see the full error message
							href={scope.href}
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'never'.
							key={scope.type}
							text={
								<div className={`scope-item item-${index}`}>
									<div className="top">
										{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'icon' does not exist on type 'never'. */}
										<Icon icon={scope.icon} iconSize={10} />
										{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'never'. */}
										{scope.type}
									</div>
									<div className="bottom">
										<Avatar
											// @ts-expect-error ts-migrate(2339) FIXME: Property 'avatar' does not exist on type 'never'.
											avatar={scope.avatar}
											// @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'never'.
											initials={scope.title[0]}
											// @ts-expect-error ts-migrate(2322) FIXME: Property 'communityData' does not exist on type 'I... Remove this comment to see the full error message
											communityData={communityData}
											width={18}
											isBlock={true}
										/>
										{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'never'. */}
										{scope.title}
									</div>
								</div>
							}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default ScopeDropdown;
