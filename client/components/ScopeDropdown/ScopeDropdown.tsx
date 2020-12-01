import React from 'react';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';
import { Avatar, Icon, MenuItem } from 'components';

require('./scopeDropdown.scss');

type Scope = {
	type: string;
	icon: string;
	iconSize?: number;
	title: string;
	avatar: string;
	href: string;
};

type Props = {
	isDashboard?: boolean;
};

const ScopeDropdown = (props: Props) => {
	const { isDashboard } = props;
	const { locationData, communityData, scopeData, pageData } = usePageContext();
	const { activeCollection, activePub } = scopeData.elements;
	const { canManageCommunity } = scopeData.activePermissions;
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;

	const scopes: Scope[] = [];
	scopes.push({
		type: 'Community',
		icon: 'office',
		title: communityData.title,
		avatar: communityData.avatar,
		href: getDashUrl({}),
	});
	if (pageData && canManageCommunity && !isDashboard) {
		scopes.push({
			type: 'Page',
			icon: 'page-layout',
			iconSize: 12,
			title: pageData.title,
			avatar: pageData.avatar,
			href: getDashUrl({ mode: 'pages', subMode: pageData.slug || 'home' }),
		});
	}
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
		<div className="scope-dropdown-component">
			{isDashboard && <div className="intro">Select Scope:</div>}
			<div className="scopes">
				{scopes.map((scope, index) => {
					return (
						<MenuItem
							href={scope.href}
							key={scope.type}
							text={
								<div className={`scope-item item-${index}`}>
									<div className="top">
										<Icon icon={scope.icon} iconSize={scope.iconSize || 10} />
										{scope.type}
									</div>
									<div className="bottom">
										<Avatar
											avatar={scope.avatar}
											initials={scope.title[0]}
											// @ts-expect-error ts-migrate(2322) FIXME: Type '{ avatar: string; initials: string; communit... Remove this comment to see the full error message
											communityData={communityData}
											width={18}
											isBlock={true}
										/>
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
