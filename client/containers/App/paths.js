import {
	About,
	AdminDashboard,
	CommunityCreate,
	DashboardMembers,
	DashboardOverview,
	Explore,
	Landing,
	Login,
	NoMatch,
	Page,
	PasswordReset,
	Pricing,
	Privacy,
	Pub,
	Search,
	Signup,
	Terms,
	User,
	UserCreate,
} from 'containers';

export default (viewData, locationData, chunkName) => {
	const paths = {
		About: {
			ActiveComponent: About,
			hideNav: locationData.isBasePubPub,
		},
		AdminDashboard: {
			ActiveComponent: AdminDashboard,
			hideNav: true,
			hideFooter: true,
		},
		CommunityCreate: {
			ActiveComponent: CommunityCreate,
			hideNav: true,
			hideFooter: true,
		},
		DashboardMembers: {
			ActiveComponent: DashboardMembers,
			isDashboard: true,
		},
		DashboardOverview: {
			ActiveComponent: DashboardOverview,
			isDashboard: true,
		},
		Explore: {
			ActiveComponent: Explore,
			hideNav: true,
		},
		Landing: {
			ActiveComponent: Landing,
			hideNav: true,
		},
		Login: {
			ActiveComponent: Login,
			hideNav: true,
			hideFooter: true,
		},
		NoMatch: {
			ActiveComponent: NoMatch,
			hideNav: locationData.isBasePubPub,
			hideFooter: true,
		},
		Page: {
			ActiveComponent: Page,
		},
		PasswordReset: {
			ActiveComponent: PasswordReset,
			hideNav: true,
			hideFooter: true,
		},
		Pricing: {
			ActiveComponent: Pricing,
			hideNav: true,
			hideFooter: true,
		},
		Privacy: {
			ActiveComponent: Privacy,
			hideNav: locationData.isBasePubPub,
		},
		Pub: {
			ActiveComponent: Pub,
		},
		Search: {
			ActiveComponent: Search,
			hideNav: locationData.isBasePubPub,
			hideFooter: true,
		},
		Signup: {
			ActiveComponent: Signup,
			hideNav: true,
			hideFooter: true,
		},
		Terms: {
			ActiveComponent: Terms,
			hideNav: locationData.isBasePubPub,
		},
		User: {
			ActiveComponent: User,
			hideNav: locationData.isBasePubPub,
		},
		UserCreate: {
			ActiveComponent: UserCreate,
			hideNav: locationData.isBasePubPub,
			hideFooter: true,
		},
	};
	return paths[chunkName];
};
