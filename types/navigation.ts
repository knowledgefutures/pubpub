import { DashboardMode } from 'utils/dashboard';
import { Collection } from './collection';
import { Community } from './community';
import { Page } from './page';
import { IconName } from '../client/components/Icon/Icon';

export type NavBuilderCommunity = Pick<Community, 'website' | 'twitter' | 'facebook' | 'email'>;
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
