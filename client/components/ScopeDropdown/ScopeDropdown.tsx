import React, { useMemo } from 'react';
import classNames from 'classnames';

import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';
import { Avatar, Icon, IconName, MenuItem } from 'components';
import { getPrimaryCollectionPub } from 'utils/collections/primary';
import { sortByRank } from 'utils/rank';
import { Collection, Pub } from 'types';
import { pubPubIcons } from 'client/utils/icons';

require('./scopeDropdown.scss');

type Scope = {
	type: string;
	icon: IconName;
	iconSize?: number;
	title: string;
	avatar: undefined | string;
	slugs?: {
		collectionSlug?: string;
		pubSlug?: string;
		pageSlug?: string;
	};
	href: string;
	showSettings: boolean;
};

type Props = {
	isDashboard?: boolean;
};

const canManageCollection = (
	communityCollections: any[],
	availableCollection: Collection,
	loggedInUserId: string | null,
): boolean => {
	return !!communityCollections.find(
		(collection) =>
			collection.id === availableCollection.id &&
			collection.members.find(
				(member) =>
					member.userId === loggedInUserId &&
					(member.permissions === 'manage' || member.permissions === 'admin'),
			),
	);
};

const getPrimaryOrFirstCollection = (
	activePub: Pub | undefined,
	communityData,
): Collection | undefined => {
	if (!activePub || !activePub.collectionPubs || activePub.collectionPubs.length === 0)
		return undefined;
	const primaryOrFirstCollectionPub =
		getPrimaryCollectionPub(activePub.collectionPubs) ||
		sortByRank(activePub.collectionPubs, 'pubRank')[0];
	const collection = communityData.collections.find(
		(availableCollection: Collection) =>
			primaryOrFirstCollectionPub.collectionId === availableCollection.id,
	);
	return collection;
};

const ScopeDropdown = (props: Props) => {
	const { isDashboard } = props;
	const { loginData, locationData, communityData, scopeData, pageData } = usePageContext();
	const { activeCollection, activePub } = scopeData.elements;
	const { canManageCommunity, canManage } = scopeData.activePermissions;
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;
	const nonActiveDashboardCollectionPub = useMemo(
		() => getPrimaryOrFirstCollection(activePub, communityData),
		[activePub, communityData],
	);
	const scopes: Scope[] = [];
	scopes.push({
		type: 'Community',
		icon: pubPubIcons.community,
		title: communityData.title,
		avatar: communityData.avatar,
		href: getDashUrl({}),
		showSettings: canManageCommunity,
	});
	if (pageData && canManageCommunity && !isDashboard) {
		scopes.push({
			type: 'Page',
			icon: pubPubIcons.page,
			iconSize: 12,
			title: pageData.title,
			avatar: pageData.avatar,
			slugs: { pageSlug: pageData.slug || 'home' },
			href: getDashUrl({ mode: 'pages', subMode: pageData.slug || 'home' }),
			showSettings: canManageCommunity,
		});
	}
	if (activeCollection) {
		scopes.push({
			type: 'Collection',
			icon: pubPubIcons.collection,
			title: activeCollection.title,
			avatar: activeCollection.avatar,
			slugs: { collectionSlug },
			href: getDashUrl({
				collectionSlug,
			}),
			showSettings:
				canManageCommunity ||
				canManageCollection(communityData.collections, activeCollection, loginData.id),
		});
	}
	if (!activeCollection && nonActiveDashboardCollectionPub) {
		scopes.push({
			type: 'Collection',
			icon: pubPubIcons.collection,
			title: nonActiveDashboardCollectionPub.title,
			avatar: nonActiveDashboardCollectionPub.avatar,
			slugs: { collectionSlug: nonActiveDashboardCollectionPub.slug },
			href: getDashUrl({
				collectionSlug: nonActiveDashboardCollectionPub.slug,
			}),
			showSettings:
				canManageCommunity ||
				canManageCollection(
					communityData.collections,
					nonActiveDashboardCollectionPub,
					loginData.id,
				),
		});
	}
	if (activePub) {
		scopes.push({
			type: 'Pub',
			icon: pubPubIcons.pub,
			title: activePub.title,
			avatar: activePub.avatar,
			slugs: { pubSlug: `${pubSlug}` },
			href: getDashUrl({
				collectionSlug,
				pubSlug,
			}),
			showSettings: canManage,
		});
	}

	return (
		<div className={classNames('scope-dropdown-component', isDashboard && 'in-dashboard')}>
			{isDashboard && <div className="intro">Select Scope:</div>}
			<div className="scopes">
				{scopes.map((scope, index) => {
					return (
						<MenuItem
							href={scope.href}
							key={scope.type}
							text={
								<div className={`scope-item item-${index}`}>
									<div className="content">
										<div className="top">
											<Icon
												icon={scope.icon}
												iconSize={scope.iconSize || 10}
											/>
											{scope.type}
										</div>
										<div className="bottom">
											<Avatar
												avatar={scope.avatar}
												initials={scope.title[0]}
												width={18}
												isBlock={true}
											/>
											{scope.title}
										</div>
									</div>
									{scope.showSettings && scope.type !== 'Page' && (
										<div className="settings">
											<a
												href={getDashUrl({
													collectionSlug:
														scope.slugs && scope.slugs.collectionSlug,
													pubSlug: scope.slugs && scope.slugs.pubSlug,
													mode: 'settings',
												})}
											>
												<Icon icon={pubPubIcons.settings} iconSize={12} />
											</a>
											<a
												href={getDashUrl({
													collectionSlug:
														scope.slugs && scope.slugs.collectionSlug,
													pubSlug: scope.slugs && scope.slugs.pubSlug,
													mode: 'members',
												})}
											>
												<Icon icon={pubPubIcons.member} iconSize={12} />
											</a>
											<a
												href={getDashUrl({
													collectionSlug:
														scope.slugs && scope.slugs.collectionSlug,
													pubSlug: scope.slugs && scope.slugs.pubSlug,
													mode: 'impact',
												})}
											>
												<Icon icon={pubPubIcons.impact} iconSize={12} />
											</a>
											{scope.type === 'Collection' && (
												<a
													href={getDashUrl({
														collectionSlug:
															scope.slugs &&
															scope.slugs.collectionSlug,
														pubSlug: scope.slugs && scope.slugs.pubSlug,
														mode: 'layout',
													})}
												>
													<Icon icon={pubPubIcons.layout} iconSize={12} />
												</a>
											)}
											<a
												href={`/${
													(scope.slugs &&
														scope.slugs.pubSlug &&
														'pub/' + scope.slugs.pubSlug) ||
													(scope.slugs && scope.slugs.collectionSlug)
												}`}
											>
												<Icon icon="globe" iconSize={12} />
											</a>
										</div>
									)}
									{scope.showSettings && scope.type === 'Page' && (
										<div className="settings">
											<a
												href={`/${
													(scope.slugs && scope.slugs.pageSlug) || '/'
												}`}
											>
												<Icon icon="globe" iconSize={12} />
											</a>
										</div>
									)}
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
