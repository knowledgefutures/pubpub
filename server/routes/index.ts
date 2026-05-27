import { Router } from 'express';

// KF Auth integration (OIDC + internal API)
import { router as kfAuthRouter } from '../kf/api';
/* import { router as picingRouter} from './picing'); // Route: '/pricing' */
import { router as adminDashboardRouter } from './adminDashboard'; // Route: '/admin' (redirect to superadmin)
import { router as authenticateRouter } from './authenticate'; // Route: '/auth'
import { router as collectionRouter } from './collection'; // Route: /collection/:id
/* Routes for PubPub */
import { router as communityCreateRouter } from './communityCreate'; // Route: '/community/create'
import { router as dashboardActivityRouter } from './dashboardActivity';
import { router as dashboardCollectionLayoutRouter } from './dashboardCollectionLayout';
import { router as dashboardCollectionOverviewRouter } from './dashboardCollectionOverview';
import { router as dashboardCommunityOverviewRouter } from './dashboardCommunityOverview';
import { router as dashboardCuratedByRouter } from './dashboardCuratedBy';
import { router as dashboardCustomScriptsRouter } from './dashboardCustomScripts';
import { router as dashboardDiscussionsRouter } from './dashboardDiscussions';
import { router as dashboardEdgesRouter } from './dashboardEdges';
import { router as dashboardFacetsRouter } from './dashboardFacets';
import { router as dashboardImpactRouter } from './dashboardImpact';
import { router as dashboardImpact2Router } from './dashboardImpact2';
import { router as dashboardMembersRouter } from './dashboardMembers';
import { router as dashboardPageRouter } from './dashboardPage';
import { router as dashboardPagesRouter } from './dashboardPages';
import { router as dashboardPubOverviewRouter } from './dashboardPubOverview';
import { router as dashboardReviewRouter } from './dashboardReview';
import { router as dashboardReviewsRouter } from './dashboardReviews';
import { router as dashboardSettingsRouter } from './dashboardSettings';
import { router as dashboardSubmissionsRouter } from './dashboardSubmissions';
/* import { router as aoutRouter} from './aout'); // Route: '/about' */
import { router as emailRouter } from './email'; // Route: '/email'
/* import { router as cmmunityServicesRouter} from './cmmunityServices'); // Route: '/community-services' */
import { router as exploreRouter } from './explore'; // Route: '/explore'
import { router as hubDataRouter } from './hubData';
import { router as hubDirectoryRouter } from './hubDirectory';
import { router as hubDocsRouter } from './hubDocs';
import { router as hubLandingRouter } from './hubLanding';
import { router as hubPricingRouter } from './hubPricing';

/* import { router as picingRouter} from './picing'); // Route: '/pricing' */

import { router as landingRouter } from './landing'; // Route: '/'
import { router as legalRouter } from './legal'; // Route: '/legal'
/* Routes for all */
import { router as loginRouter } from './login.kf'; // Route: '/login' → redirect to KF Auth
import { router as noMatchRouter } from './noMatch';
import { router as pageRouter } from './page'; // Route: ['/', '/:slug']
import { router as passwordResetRouter } from './passwordReset.kf'; // Route: '/password-reset' → redirect to KF Auth
/* Routes for Communities */
import { router as pubDocumentRouter } from './pubDocument';
import { router as pubDownloadsRouter } from './pubDownloads';
import { router as pubRedirectsRouter } from './pubRedirects';
import { router as redirectsRouter } from './redirects'; // Redirect needed v3 routes;
import { router as robotsRouter } from './robots'; // Route: /robots.txt
import { router as search2Router } from './search2'; // Route: '/search'
import { router as signupRouter } from './signup.kf'; // Route: '/signup' → redirect to KF Auth
import { router as sitemapRouter } from './sitemap'; // Route: /sitemap-*.xml
import { router as submitRouter } from './submit';
import { router as superAdminDashboardRouter } from './superAdminDashboard'; // Route: /superadmin
import { router as userRouter } from './user'; // Route: ['/user/:slug', '/user/:slug/:mode']

const rootRouter = Router(); // Route: '/*'

rootRouter
	.use(redirectsRouter)
	.use(pubRedirectsRouter)
	.use(pubDocumentRouter)
	.use(pubDownloadsRouter)
	.use(collectionRouter)
	.use(dashboardActivityRouter)
	.use(dashboardDiscussionsRouter)
	.use(dashboardEdgesRouter)
	.use(dashboardFacetsRouter)
	.use(dashboardImpactRouter)
	.use(dashboardImpact2Router)
	.use(dashboardMembersRouter)
	.use(dashboardCommunityOverviewRouter)
	.use(dashboardCuratedByRouter)
	.use(dashboardCollectionOverviewRouter)
	.use(dashboardCustomScriptsRouter)
	.use(dashboardPubOverviewRouter)
	.use(dashboardPageRouter)
	.use(dashboardPagesRouter)
	.use(dashboardReviewRouter)
	.use(dashboardReviewsRouter)
	.use(dashboardSettingsRouter)
	.use(dashboardSubmissionsRouter)
	.use(dashboardCollectionLayoutRouter)
	.use(submitRouter)
	.use(communityCreateRouter)
	.use(exploreRouter)
	.use(emailRouter)
	.use(hubDataRouter)
	.use(hubDocsRouter)
	.use(hubPricingRouter)
	.use(hubDirectoryRouter)
	.use(hubLandingRouter)
	.use(adminDashboardRouter)
	.use(landingRouter)
	.use(kfAuthRouter)
	.use(loginRouter)
	.use(authenticateRouter)
	.use(legalRouter)
	.use(search2Router)
	.use(signupRouter)
	.use(superAdminDashboardRouter)
	.use(passwordResetRouter)
	.use(userRouter)
	.use(pageRouter)
	.use(sitemapRouter)
	.use(robotsRouter)
	.use(noMatchRouter);

export { rootRouter };
