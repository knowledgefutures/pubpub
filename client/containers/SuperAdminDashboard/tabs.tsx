import type { SuperAdminTabKind } from 'utils/superAdmin';

import React from 'react';

import CommunitySpam from './CommunitySpam';
import CommunityTemplates from './CommunityTemplates';
import CustomDomains from './CustomDomains';
import DepositTargets from './DepositTargets';
import ExploreCommunities from './ExploreCommunities';
import Hubs from './Hubs';
import LandingPageFeatures from './LandingPageFeatures';
import PlatformAnalytics from './PlatformAnalytics';
import ScamFiles from './ScamFiles';
import SuggestedHubs from './SuggestedHubs';
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
	depositTargets: {
		title: 'Deposit Targets',
		component: DepositTargets,
	},
	exploreCommunities: {
		title: 'Explore Page',
		component: ExploreCommunities,
	},
	landingPageFeatures: {
		title: 'Landing Page features',
		component: LandingPageFeatures,
	},
	hubs: {
		title: 'Hubs',
		component: Hubs,
	},
	suggestedHubs: {
		title: 'Suggested Hubs',
		component: SuggestedHubs,
	},
	templates: {
		title: 'Templates',
		component: CommunityTemplates,
	},
	spam: {
		title: 'Spam Communities',
		component: CommunitySpam,
	},
	spamUsers: {
		title: 'Spam Users',
		component: UserSpam,
	},
	scamFiles: {
		title: 'Scam Files',
		component: ScamFiles,
	},
};
