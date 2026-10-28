import type { SuperAdminTabKind } from 'utils/superAdmin';

import React from 'react';

import CommunitySpam from './CommunitySpam';
import CommunityTemplates from './CommunityTemplates';
import CustomDomains from './CustomDomains';
import DepositTargets from './DepositTargets';
import ExploreCommunities from './ExploreCommunities';
import FtpTargets from './FtpTargets';
import LandingPageFeatures from './LandingPageFeatures';
import Orgs from './Orgs';
import PlatformAnalytics from './PlatformAnalytics';
import SuggestedOrgs from './SuggestedOrgs';
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
	ftpTargets: {
		title: 'FTP Targets',
		component: FtpTargets,
	},
	exploreCommunities: {
		title: 'Explore Page',
		component: ExploreCommunities,
	},
	landingPageFeatures: {
		title: 'Landing Page features',
		component: LandingPageFeatures,
	},
	orgs: {
		title: 'Orgs',
		component: Orgs,
	},
	suggestedOrgs: {
		title: 'Suggested Orgs',
		component: SuggestedOrgs,
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
};
