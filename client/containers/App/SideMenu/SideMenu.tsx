import React from 'react';
import classNames from 'classnames';
import Color from 'color';
import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';
import { getDashUrl, getDashboardModes } from 'utils/dashboard';
import ScopePicker from './ScopePicker';

require('./sideMenu.scss');

const SideMenu = () => {
	const { locationData, communityData, scopeData } = usePageContext();
	const { activePermissions, elements } = scopeData;
	const { canManage } = activePermissions;
	const { activeTargetType, activeCollection } = elements;
	const collectionSlug = activeCollection && activeCollection.slug;
	const pubSlug = locationData.params.pubSlug;

	const backgroundColor = Color(communityData.accentColorDark)
		.fade(0.95)
		.rgb()
		.string();

	const contentItems = [
		{
			title: 'Overview',
			icon: 'home2' as const,
			href: getDashUrl({ collectionSlug, pubSlug }),
		},
		{
			title: 'Activity',
			icon: 'pulse' as const,
			href: getDashUrl({ collectionSlug, pubSlug, mode: 'activity' }),
			manageRequired: true,
		},
		{
			title: 'Pages',
			icon: 'page-layout' as const,
			href: getDashUrl({
				collectionSlug,
				pubSlug,
				mode: 'pages',
			}),
			validScopes: ['community'],
			manageRequired: true,
		},
		{
			title: 'Layout',
			icon: 'page-layout' as const,
			href: getDashUrl({
				collectionSlug,
				mode: 'layout',
			}),
			manageRequired: true,
			validScopes: ['collection'],
		},
		{
			title: 'Reviews',
			icon: 'social-media' as const,
			href: getDashUrl({
				collectionSlug,
				pubSlug,
				mode: 'reviews',
			}),
		},
		{
			title: 'Connections',
			icon: 'layout-auto' as const,
			href: getDashUrl({
				collectionSlug,
				pubSlug,
				mode: 'connections',
			}),
			validScopes: ['pub'],
		},
		{
			title: 'Impact',
			icon: 'dashboard' as const,
			href: getDashUrl({
				collectionSlug,
				pubSlug,
				mode: 'impact',
			}),
			validScopes: ['pub', 'community'],
		},
		{
			title: 'Members',
			icon: 'people' as const,
			href: getDashUrl({
				collectionSlug,
				pubSlug,
				mode: 'members',
			}),
			manageRequired: true,
		},
		{
			title: 'Settings',
			icon: 'cog' as const,
			href: getDashUrl({
				collectionSlug,
				pubSlug,
				mode: 'settings',
			}),
			manageRequired: true,
		},
	];

	return (
		<div className="side-menu-component">
			<style
				/* eslint-disable-next-line react/no-danger */
				dangerouslySetInnerHTML={{
					__html: `
						.menu.active:before { background: ${communityData.accentColorDark} }
						.side-menu-component { background: ${backgroundColor} }
					`,
				}}
			/>
			<ScopePicker />

			<div className="content">
				{contentItems
					.filter((item) => {
						const { validScopes, manageRequired } = item;
						const scopeIsValid = !validScopes || validScopes.includes(activeTargetType);
						const permissionIsValid = canManage || !manageRequired;
						return scopeIsValid && permissionIsValid;
					})
					.map((item) => {
						const { mode } = getDashboardModes(locationData);
						const itemMode = item.title.toLowerCase().replace(/ /gi, '-');
						const active = mode === itemMode;
						return (
							<div key={item.title} className={classNames({ menu: true, active })}>
								<a href={item.href} className="content-title">
									<Icon className="side-icon" icon={item.icon} />
									<span className="side-text">{item.title}</span>
								</a>
							</div>
						);
					})}
			</div>
		</div>
	);
};

export default SideMenu;
