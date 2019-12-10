import React from 'react';
import classNames from 'classnames';
import Color from 'color';
import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';
// import { getDashUrl, getActiveDiscussions } from 'utils/dashboard';
import { getDashUrl } from 'utils/dashboard';
import ScopePicker from './ScopePicker';

require('./sideMenu.scss');

const SideMenu = () => {
	const { locationData, communityData } = usePageContext();
	// const discussions = getActiveDiscussions(communityData, locationData);
	const discussions = [];
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;

	const backgroundColor = Color(communityData.accentColorDark)
		.fade(0.95)
		.rgb()
		.string();

	const contentItems = [
		{
			title: 'Overview',
			icon: 'home2',
			href: getDashUrl({ collectionSlug: collectionSlug, pubSlug: pubSlug }),
		},
		{
			title: 'Activity',
			icon: 'trending-up',
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
				mode: 'activity',
			}),
		},
		{
			title: 'Site',
			icon: 'page-layout',
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
				mode: 'site',
			}),
			communityOnly: true,
		},
		{
			title: 'Conversations',
			icon: 'chat2',
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
				mode: 'conversations',
				submode: 'list',
			}),
			count: discussions.length,
			children: [
				{
					title: 'List',
					href: getDashUrl({
						collectionSlug: collectionSlug,
						pubSlug: pubSlug,
						mode: 'conversations',
						submode: 'list',
					}),
				},
				{
					title: 'Labels',
					href: getDashUrl({
						collectionSlug: collectionSlug,
						pubSlug: pubSlug,
						mode: 'conversations',
						submode: 'labels',
					}),
				},
			],
		},
		{
			title: 'Reviews',
			icon: 'social-media',
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
				mode: 'reviews',
				submode: 'list',
			}),
			count: 5,
			children: [
				{
					title: 'List',
					href: getDashUrl({
						collectionSlug: collectionSlug,
						pubSlug: pubSlug,
						mode: 'reviews',
						submode: 'list',
					}),
				},
				{
					title: 'Templates',
					href: getDashUrl({
						collectionSlug: collectionSlug,
						pubSlug: pubSlug,
						mode: 'reviews',
						submode: 'templates',
					}),
				},
			],
		},
		{
			title: 'Merges',
			icon: 'git-pull',
			count: 1,
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
				mode: 'merge-requests',
			}),
		},
		{
			title: 'Impact',
			icon: 'dashboard',
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
				mode: 'impact',
			}),
		},
		{
			title: 'Members',
			icon: 'people',
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
				mode: 'members',
			}),
		},
		{
			title: 'Settings',
			icon: 'cog',
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
				mode: 'settings',
			}),
		},
	];

	return (
		<div className="side-menu-component">
			<style
				dangerouslySetInnerHTML={{
					__html: `
						.menu.active:before { background: ${communityData.accentColorDark} }
						.side-content { background: ${backgroundColor} }
					`,
				}}
			/>
			<ScopePicker />

			<div className="content">
				{contentItems
					.filter((item) => {
						return !item.communityOnly || (!collectionSlug && !pubSlug);
					})
					.map((item) => {
						const itemMode = item.title.toLowerCase().replace(/ /gi, '-')
						const active = locationData.path.split('/').slice(-1)[0] === itemMode;
						return (
							<div
								key={item.title}
								className={classNames({ menu: true, active: active })}
							>
								<a
									href={item.href}
									className={classNames({
										'content-title': true,
										'has-children': item.children,
										active: active,
									})}
								>
									<Icon className="side-icon" icon={item.icon} />
									<span className="side-text">{item.title}</span>
									{item.count !== undefined && (
										<span className="count-wrapper">
											<span className="count">{item.count}</span>
										</span>
									)}
								</a>
								{active &&
									item.children &&
									item.children.map((child) => {
										const childActive =
											child.title.toLowerCase().replace(/ /gi, '-') ===
											locationData.params.submode;
										return (
											<a
												key={child.title}
												href={child.href}
												className={classNames({
													child: true,
													active: childActive,
												})}
											>
												{child.title}
											</a>
										);
									})}
							</div>
						);
					})}
			</div>
		</div>
	);
};

export default SideMenu;
