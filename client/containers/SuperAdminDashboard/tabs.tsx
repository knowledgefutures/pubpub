import type { SuperAdminTabKind } from 'utils/superAdmin';

import React from 'react';

import CommunitySpam from './CommunitySpam';
import CustomDomains from './CustomDomains';
import ExploreCommunities from './ExploreCommunities';
import LandingPageFeatures from './LandingPageFeatures';
import PlatformAnalytics from './PlatformAnalytics';
import UserSpam from './UserSpam';

type SuperAdminTab = {
	title: string;
	component: React.FC<any>;
};

export const superAdminTabs: Record<SuperAdminTabKind, SuperAdminTab> = {
	analytics: {
		title: 'Analytics',
		component: PlatformAnalytics,
	},
	customDomains: {
		title: 'Custom Domains',
		component: CustomDomains,
	},
	exploreCommunities: {
		title: 'Explore Page',
		component: ExploreCommunities,
	},
	landingPageFeatures: {
		title: 'Landing Page features',
		component: LandingPageFeatures,
	},
	spam: {
		title: 'Spam Communities',
		component: CommunitySpam,
	},
	spamUsers: {
		title: 'Spam Users',
		component: UserSpam,
	},
};
