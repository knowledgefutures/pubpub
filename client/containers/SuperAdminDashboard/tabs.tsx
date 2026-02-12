import type { SuperAdminTabKind } from 'utils/superAdmin';

import React from 'react';

import CommunitySpam from './CommunitySpam';
import LandingPageFeatures from './LandingPageFeatures';
import UserSpam from './UserSpam';

type SuperAdminTab = {
	title: string;
	component: React.FC<any>;
};

export const superAdminTabs: Record<SuperAdminTabKind, SuperAdminTab> = {
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
