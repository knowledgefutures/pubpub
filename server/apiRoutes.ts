import { Router } from 'express';

import { isProd } from 'utils/environment';

import { activityItemRouter } from './activityItem/api';
import { router as apiDocsRouter } from './apiDocs/api';
import { router as citationRouter } from './citation/api';
import { router as communityServicesRouter } from './communityServices/api';
import { router as customScriptRouter } from './customScript/api';
import { router as devApiRouter } from './dev/api';
import { router as discussionRouter } from './discussion/api';
import { router as doiRouter } from './doi/api';
import { router as editorRouter } from './editor/api';
import { router as integrationDataOAuth1Router } from './integrationDataOAuth1/api';
import { router as landingPageFeatureRouter } from './landingPageFeature/api';
import { router as layoutRouter } from './layout/api';
import { router as openSearchRouter } from './openSearch/api';
import { router as passwordResetRouter } from './passwordReset/api';
import { router as pubEdgeProposalRouter } from './pubEdgeProposal/api';
import { router as pubHistoryRouter } from './pubHistory/api';
import { router as reviewRouter } from './review/api';
import { router as reviewerRouter } from './reviewer/api';
import { router as rssRouter } from './rss/api';
import { router as searchRouter } from './search/api';
import { router as signupRouter } from './signup/api';
import { router as spamTagRouter } from './spamTag/api';
import { router as submissionRouter } from './submission/api';
import { router as submissionWorkflowRouter } from './submissionWorkflow/api';
import { router as subscribeRouter } from './subscribe/api';
import { router as threadCommentRouter } from './threadComment/api';
import { router as userRouter } from './user/api';
import { router as userDismissableRouter } from './userDismissable/api';
import { router as userNotificationRouter } from './userNotification/api';
import { router as userNotificationPreferencesRouter } from './userNotificationPreferences/api';
import { userSubscriptionRouter } from './userSubscription/api';
import { router as zoteroIntegrationRouter } from './zoteroIntegration/api';

const apiRouter = Router()
	.use(activityItemRouter)
	.use(citationRouter)
	.use(communityServicesRouter)
	.use(customScriptRouter)
	.use(discussionRouter)
	.use(doiRouter)
	.use(editorRouter)
	.use(integrationDataOAuth1Router)
	.use(landingPageFeatureRouter)
	.use(layoutRouter)
	.use(openSearchRouter)
	.use(passwordResetRouter)
	.use(pubEdgeProposalRouter)
	.use(pubHistoryRouter)
	.use(reviewRouter)
	.use(reviewerRouter)
	.use(rssRouter)
	.use(searchRouter)
	.use(signupRouter)
	.use(spamTagRouter)
	.use(subscribeRouter)
	.use(submissionWorkflowRouter)
	.use(submissionRouter)
	.use(threadCommentRouter)
	.use(userRouter)
	.use(userDismissableRouter)
	.use(userNotificationRouter)
	.use(userNotificationPreferencesRouter)
	.use(userSubscriptionRouter)
	.use(zoteroIntegrationRouter)
	.use(apiDocsRouter);

if (!isProd() && process.env.NODE_ENV !== 'test') {
	apiRouter.use(devApiRouter);
}

// make it a module
export { apiRouter };
