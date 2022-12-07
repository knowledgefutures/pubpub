import React from 'react';

import { SuperAdminTabKind } from 'utils/superAdmin';

import LandingPageFeatures from './LandingPageFeatures';
import CommunitySpam from './CommunitySpam';

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
};
