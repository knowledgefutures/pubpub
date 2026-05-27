import {
	About,
	Collection,
	CommunityCreate,
	CommunityServices,
	DashboardActivity,
	DashboardCollectionLayout,
	DashboardCollectionOverview,
	DashboardCommunityOverview,
	DashboardCuratedBy,
	DashboardCustomScripts,
	DashboardDiscussions,
	DashboardEdges,
	DashboardFacets,
	DashboardImpact,
	DashboardImpact2,
	DashboardMembers,
	DashboardPage,
	DashboardPages,
	DashboardPubOverview,
	DashboardReview,
	DashboardReviews,
	DashboardSettings,
	DashboardSubmissions,
	DashboardSubmissionWorkflow,
	Explore,
	HubData,
	HubDirectory,
	HubDocs,
	HubLanding,
	HubPricing,
	Landing,
	Legal,
	Login,
	NoMatch,
	Page,
	PasswordReset,
	Pricing,
	Pub,
	Search2,
	Signup,
	SuperAdminDashboard,
	User,
	UserCreate,
} from 'containers';

export default (viewData, locationData, chunkName) => {
	const paths = {
		About: {
			ActiveComponent: About,
			hideNav: locationData.isBasePubPub,
		},
		Collection: {
			ActiveComponent: Collection,
		},
		CommunityCreate: {
			ActiveComponent: CommunityCreate,
			hideNav: true,
			hideHeader: !!viewData?.hubData,
			hideFooter: true,
		},
		CommunityServices: {
			ActiveComponent: CommunityServices,
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
		DashboardFacets: {
			ActiveComponent: DashboardFacets,
			isDashboard: true,
		},
		DashboardImpact: {
			ActiveComponent: DashboardImpact,
			isDashboard: true,
		},
		DashboardImpact2: {
			ActiveComponent: DashboardImpact2,
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
		DashboardCuratedBy: {
			ActiveComponent: DashboardCuratedBy,
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
		DashboardSubmissionWorkflow: {
			ActiveComponent: DashboardSubmissionWorkflow,
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
		Legal: {
			ActiveComponent: Legal,
			hideNav: locationData.isBasePubPub,
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
		HubData: {
			ActiveComponent: HubData,
			hideNav: true,
			hideHeader: true,
			hideFooter: true,
		},
		HubDirectory: {
			ActiveComponent: HubDirectory,
			hideNav: locationData.isBasePubPub,
		},
		HubDocs: {
			ActiveComponent: HubDocs,
			hideNav: locationData.isBasePubPub,
		},
		HubLanding: {
			ActiveComponent: HubLanding,
			hideNav: true,
			hideHeader: true,
			hideFooter: true,
		},
		HubPricing: {
			ActiveComponent: HubPricing,
			hideNav: locationData.isBasePubPub,
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
		Pub: {
			ActiveComponent: Pub,
		},
		Search2: {
			ActiveComponent: Search2,
			hideNav: locationData.isBasePubPub,
			hideFooter: true,
		},
		Signup: {
			ActiveComponent: Signup,
			hideNav: true,
			hideFooter: true,
		},
		SuperAdminDashboard: {
			ActiveComponent: SuperAdminDashboard,
			hideNav: true,
			hideFooter: true,
			hideHeader: true,
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
