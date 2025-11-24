import { Router } from 'express';

import { router as collectionRouter } from './collection'; // Route: /collection/:id
/* Routes for PubPub */
import { router as communityCreateRouter } from './communityCreate'; // Route: '/community/create'
import { router as dashboardActivityRouter } from './dashboardActivity';
import { router as dashboardCollectionLayoutRouter } from './dashboardCollectionLayout';
import { router as dashboardCollectionOverviewRouter } from './dashboardCollectionOverview';
import { router as dashboardCommunityOverviewRouter } from './dashboardCommunityOverview';
import { router as dashboardCustomScriptsRouter } from './dashboardCustomScripts';
import { router as dashboardDiscussionsRouter } from './dashboardDiscussions';
import { router as dashboardEdgesRouter } from './dashboardEdges';
import { router as dashboardFacetsRouter } from './dashboardFacets';
import { router as dashboardImpactRouter } from './dashboardImpact';
import { router as dashboardMembersRouter } from './dashboardMembers';
import { router as dashboardPageRouter } from './dashboardPage';
import { router as dashboardPagesRouter } from './dashboardPages';
import { router as dashboardPubOverviewRouter } from './dashboardPubOverview';
import { router as dashboardReviewRouter } from './dashboardReview';
import { router as dashboardReviewsRouter } from './dashboardReviews';
import { router as dashboardSettingsRouter } from './dashboardSettings';
import { router as dashboardSubmissionsRouter } from './dashboardSubmissions';
/* import { router as cmmunityServicesRouter} from './cmmunityServices'); // Route: '/community-services' */
/* import { router as eploreRouter} from './eplore'); // Route: '/explore' */
/* import { router as aoutRouter} from './aout'); // Route: '/about' */
import { router as emailRouter } from './email'; // Route: '/email'
/* Routes for Communities */
import { router as pubDocumentRouter } from './pubDocument';
import { router as pubDownloadsRouter } from './pubDownloads';
import { router as pubRedirectsRouter } from './pubRedirects';
import { router as redirectsRouter } from './redirects'; // Redirect needed v3 routes;
import { router as submitRouter } from './submit';

/* import { router as picingRouter} from './picing'); // Route: '/pricing' */

import { router as adminDashboardRouter } from './adminDashboard'; // Route: '/admin'
import { router as authenticateRouter } from './authenticate'; // Route: '/auth'
import { router as landingRouter } from './landing'; // Route: '/'
import { router as legalRouter } from './legal'; // Route: '/legal'
/* Routes for all */
import { router as loginRouter } from './login'; // Route: '/login'
import { router as noMatchRouter } from './noMatch';
import { router as pageRouter } from './page'; // Route: ['/', '/:slug']
import { router as passwordResetRouter } from './passwordReset'; // Route: ['/password-reset', '/password-reset/:resetHash/:slug']
import { router as robotsRouter } from './robots'; // Route: /robots.txt
import { router as searchRouter } from './search'; // Route: '/search'
import { router as signupRouter } from './signup'; // Route: '/signup'
import { router as sitemapRouter } from './sitemap'; // Route: /sitemap-*.xml
import { router as superAdminDashboardRouter } from './superAdminDashboard'; // Route: /superadmin
import { router as userRouter } from './user'; // Route: ['/user/:slug', '/user/:slug/:mode']
import { router as userCreateRouter } from './userCreate'; // Route: '/user/create/:hash'

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
	.use(dashboardMembersRouter)
	.use(dashboardCommunityOverviewRouter)
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
	.use(emailRouter)
	.use(adminDashboardRouter)
	.use(landingRouter)
	.use(loginRouter)
	.use(authenticateRouter)
	.use(legalRouter)
	.use(searchRouter)
	.use(signupRouter)
	.use(superAdminDashboardRouter)
	.use(passwordResetRouter)
	.use(userCreateRouter)
	.use(userRouter)
	.use(pageRouter)
	.use(sitemapRouter)
	.use(robotsRouter)
	.use(noMatchRouter);

export { rootRouter };
