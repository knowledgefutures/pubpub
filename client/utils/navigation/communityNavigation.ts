import { IconName } from 'components';
import * as types from 'types';
import { expect } from 'utils/assert';

export const isCommunityNavigationMenu = (
	item: types.CommunityNavigationEntry,
): item is types.CommunityNavigationMenu => typeof item === 'object' && 'children' in item;

type NavbarChild = {
	title: string;
	id: string;
	href: string;
	isPrivate?: true;
	isExternal?: true;
};

export type NavbarMenu = { title: string; id: string; children: NavbarChild[] };
export type NavbarItem = NavbarChild | NavbarMenu;
export const isNavbarMenu = (item: NavbarItem): item is NavbarMenu => 'children' in item;

export const defaultFooterLinks: types.CommunityNavigationEntry[] = [
	{ id: 'rss', title: 'RSS', href: '/rss.xml' },
	{ id: 'legal', title: 'Legal', href: '/legal' },
];

export type SocialItem = {
	id: string;
	icon: IconName;
	title: string;
	value: string;
	url: string;
	/**
	 * For rendering additional attributes on a link, e.g. for verification purposes (mastodon
	 * requires rel="me" for verification, for example)
	 */
	additionalAttributes?: {
		rel: string;
	};
};

export const createSocialNavItems = (
	communityData: types.NavBuilderCommunity,
	location?: 'header' | 'footer',
) => {
	if (
		Boolean(communityData.socialLinksLocation) &&
		Boolean(location) &&
		communityData.socialLinksLocation !== location
	) {
		return [] as SocialItem[];
	}

	const possibleItems = [
		{
			id: 'si-0',
			icon: 'globe' as const,
			title: 'Website',
			value: communityData.website,
			url: communityData.website,
		},
		{
			id: 'si-1',
			icon: 'twitter' as const,
			title: 'Twitter',
			value: communityData.twitter,
			url: `https://twitter.com/${communityData.twitter}`,
		},
		{
			id: 'si-2',
			icon: 'facebook' as const,
			title: 'Facebook',
			value: communityData.facebook,
			url: `https://facebook.com/${communityData.facebook}`,
		},
		{
			id: 'si-3',
			icon: 'instagram' as const,
			title: 'Instagram',
			value: communityData.instagram,
			url: `https://instagram.com/${communityData.instagram}`,
		},
		{
			id: 'si-4',
			icon: 'mastodon' as const,
			title: 'Mastodon',
			value: communityData.mastodon,
			url: `https://${communityData.mastodon}`,
			additionalAttributes: {
				rel: 'me',
			},
		},
		{
			id: 'si-5',
			icon: 'linkedin' as const,
			title: 'LinkedIn',
			value: communityData.linkedin,
			url: `https://linkedin.com/in/${communityData.linkedin}`,
		},
		{
			id: 'si-6',
			icon: 'bluesky' as const,
			title: 'Bluesky',
			value: communityData.bluesky,
			url: `https://bsky.app/profile/@${communityData.bluesky}`,
		},
		{
			id: 'si-7',
			icon: 'github' as const,
			title: 'GitHub',
			value: communityData.github,
			url: `https://github.com/${communityData.github}`,
		},
		{
			id: 'si-8',
			icon: 'envelope' as const,
			title: 'Contact',
			value: communityData.email,
			url: `mailto:${communityData.email}`,
		},
	];

	return possibleItems.filter((item) => Boolean(item.value && item.url)) as SocialItem[];
};

const getNavbarChildForPageOrCollection = (
	item: types.NavBuilderPage | types.NavBuilderCollection,
): NavbarChild => {
	return {
		title: expect(item.title),
		href: `/${item.slug}`,
		id: item.id,
		...(!item.isPublic && { isPrivate: true }),
	};
};

const getNavbarItemForCommunityNavigationChild = (
	navEntry: types.CommunityNavigationChild,
	ctx: types.NavBuildContext,
): null | NavbarChild => {
	const { pages, collections } = ctx;
	if ('type' in navEntry) {
		const { type, id } = navEntry;
		const item =
			type === 'collection'
				? collections.find((c) => c.id === id)
				: pages.find((p) => p.id === id);
		if (item) {
			return getNavbarChildForPageOrCollection(item);
		}
	} else if ('href' in navEntry) {
		const { title, href, id } = navEntry;
		const isExternal = !href.startsWith('/');
		return {
			title,
			href,
			id,
			...(isExternal && { isExternal: true }),
		};
	}
	return null;
};

const getNavbarItemForCommunityNavigationEntry = (
	navEntry: types.CommunityNavigationEntry,
	ctx: types.NavBuildContext,
): null | NavbarItem => {
	if (isCommunityNavigationMenu(navEntry)) {
		const { title, children, id } = navEntry;
		return {
			title,
			id,
			children: children
				.map((child) => getNavbarItemForCommunityNavigationChild(child, ctx))
				.filter((x: null | NavbarChild): x is NavbarChild => !!x),
		};
	}
	return getNavbarItemForCommunityNavigationChild(navEntry, ctx);
};

export const getNavItemsForCommunityNavigation = ({
	navigation,
	collections,
	pages,
}: { navigation: types.CommunityNavigationEntry[] } & types.NavBuildContext): NavbarItem[] => {
	return navigation
		.map((item) =>
			getNavbarItemForCommunityNavigationEntry(item, {
				collections,
				pages,
			}),
		)
		.filter((x: null | NavbarItem): x is NavbarItem => !!x);
};
