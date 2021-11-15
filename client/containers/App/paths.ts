import {
	About,
	AdminDashboard,
	CommunityCreate,
	DashboardActivity,
	DashboardCommunityOverview,
	DashboardCollectionOverview,
	DashboardPubOverview,
	DashboardCollectionLayout,
	DashboardCustomScripts,
	DashboardDiscussions,
	DashboardEdges,
	DashboardImpact,
	DashboardMembers,
	DashboardReview,
	DashboardReviews,
	DashboardPages,
	DashboardPage,
	DashboardSettings,
	DashboardSubmissions,
	Collection,
	Explore,
	Landing,
	Login,
	NoMatch,
	Page,
	PasswordReset,
	Pricing,
	Legal,
	Pub,
	Search,
	Signup,
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
		DashboardActivity: {
			ActiveComponent: DashboardActivity,
			isDashboard: true,
		},
		DashboardDiscussions: {
			ActiveComponent: DashboardDiscussions,
			isDashboard: true,
		},
		DashboardEdges: {
			ActiveComponent: DashboardEdges,
			isDashboard: true,
		},
		DashboardImpact: {
			ActiveComponent: DashboardImpact,
			isDashboard: true,
		},
		DashboardMembers: {
			ActiveComponent: DashboardMembers,
			isDashboard: true,
		},
		DashboardCommunityOverview: {
			ActiveComponent: DashboardCommunityOverview,
			isDashboard: true,
		},
		DashboardCollectionOverview: {
			ActiveComponent: DashboardCollectionOverview,
			isDashboard: true,
		},
		DashboardPubOverview: {
			ActiveComponent: DashboardPubOverview,
			isDashboard: true,
		},
		DashboardPages: {
			ActiveComponent: DashboardPages,
			isDashboard: true,
		},
		DashboardPage: {
			ActiveComponent: DashboardPage,
			isDashboard: true,
		},
		DashboardReviews: {
			ActiveComponent: DashboardReviews,
			isDashboard: true,
		},
		DashboardReview: {
			ActiveComponent: DashboardReview,
			isDashboard: true,
		},
		DashboardSettings: {
			ActiveComponent: DashboardSettings,
			isDashboard: true,
		},
		DashboardSubmissions: {
			ActiveComponent: DashboardSubmissions,
			isDashboard: true,
		},
		DashboardCollectionLayout: {
			ActiveComponent: DashboardCollectionLayout,
			isDashboard: true,
		},
		DashboardCustomScripts: {
			ActiveComponent: DashboardCustomScripts,
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
		Legal: {
			ActiveComponent: Legal,
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
		User: {
			ActiveComponent: User,
			hideNav: locationData.isBasePubPub,
		},
		UserCreate: {
			ActiveComponent: UserCreate,
			hideNav: locationData.isBasePubPub,
			hideFooter: true,
		},
		Collection: {
			ActiveComponent: Collection,
		},
	};
	return paths[chunkName];
};
