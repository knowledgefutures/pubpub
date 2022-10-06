import { MemberPermission, PageContext } from 'types';
import { PubPubIconName } from 'client/utils/icons';
import { DashboardMode } from 'utils/dashboard';

export type ReadablePageContext = Pick<PageContext, 'scopeData' | 'locationData' | 'featureFlags'>;

type FromPageContext<T> = (context: ReadablePageContext) => T;

export type MenuItem = {
	title: string;
	icon: PubPubIconName;
	dashboardMode: DashboardMode;
	requiredPermission?: MemberPermission;
	count?: FromPageContext<number>;
	shown?: FromPageContext<boolean>;
};

const overview: MenuItem = {
	title: 'Overview',
	icon: 'overview',
	dashboardMode: 'overview',
};

const activity: MenuItem = {
	title: 'Activity',
	icon: 'activity',
	dashboardMode: 'activity',
};

const pages: MenuItem = {
	title: 'Pages',
	icon: 'page',
	dashboardMode: 'pages',
	requiredPermission: 'manage',
};

const layout: MenuItem = {
	title: 'Layout',
	icon: 'layout',
	dashboardMode: 'layout',
	requiredPermission: 'manage',
};

const reviews: MenuItem = {
	title: 'Reviews',
	icon: 'review',
	dashboardMode: 'reviews',
	count: (context) => context.scopeData.activeCounts.reviews,
};

const submissions: MenuItem = {
	title: 'Submissions',
	icon: 'submission',
	dashboardMode: 'submissions',
	requiredPermission: 'manage',
	count: (context) => context.scopeData.activeCounts.submissions,
	shown: (context) => !!context.featureFlags.submissions,
};

const connections: MenuItem = {
	title: 'Connections',
	icon: 'connection',
	dashboardMode: 'connections',
};

const impact: MenuItem = {
	title: 'Impact',
	icon: 'impact',
	dashboardMode: 'impact',
};

const members: MenuItem = {
	title: 'Members',
	icon: 'member',
	dashboardMode: 'members',
	requiredPermission: 'manage',
};

const settings: MenuItem = {
	title: 'Settings',
	icon: 'settings',
	dashboardMode: 'settings',
	requiredPermission: 'manage',
};

const facets: MenuItem = {
	title: 'Facets',
	icon: 'facets',
	dashboardMode: 'facets',
	requiredPermission: 'manage',
	shown: (context) => context.scopeData.activePermissions.isSuperAdmin,
};

export const menuItemsByScopeType = {
	organization: [],
	community: [overview, activity, pages, reviews, impact, members, facets, settings],
	collection: [
		overview,
		activity,
		layout,
		reviews,
		submissions,
		impact,
		members,
		facets,
		settings,
	],
	pub: [overview, activity, reviews, connections, impact, members, facets, settings],
} as const;
