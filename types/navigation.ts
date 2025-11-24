import type { DashboardMode } from 'utils/dashboard';

import type { IconName } from '../client/components/Icon/Icon';
import type { Collection } from './collection';
import type { Community } from './community';
import type { Page } from './page';

export type NavBuilderCommunity = Pick<
	Community,
	| 'website'
	| 'twitter'
	| 'facebook'
	| 'instagram'
	| 'mastodon'
	| 'linkedin'
	| 'bluesky'
	| 'github'
	| 'email'
	| 'socialLinksLocation'
>;
export type NavBuilderPage = Pick<Page, 'title' | 'id' | 'isPublic' | 'slug'>;
export type NavBuilderCollection = Pick<Collection, 'title' | 'id' | 'isPublic' | 'slug'>;

export type NavBuildContext = {
	pages: NavBuilderPage[];
	collections: NavBuilderCollection[];
};

export type CommunityNavigationMenu = {
	id: string;
	title: string;
	children: CommunityNavigationChild[];
};
export type CommunityNavigationChild =
	| { id: string; type: 'page' | 'collection' }
	| { id: string; title: string; href: string };

export type CommunityNavigationEntry = CommunityNavigationChild | CommunityNavigationMenu;

export type RenderedDashboardMenuItem = {
	title: string;
	icon: IconName;
	href: string;
	active: boolean;
	count: null | number;
};

export type ActiveDashboardMode = {
	mode: DashboardMode;
	subMode: string | null;
};

export type DashboardMenuState = {
	menuItems: RenderedDashboardMenuItem[];
	activeMode: null | ActiveDashboardMode;
};
