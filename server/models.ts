/* eslint-disable global-require */

import { createSequelizeModelsFromFacetDefinitions } from './facets/create';
import { sequelize } from './sequelize';

/* Import and create all models. */
/* Also export them to make them available to other modules */

export { Collection } from './collection/model';
export { CollectionAttribution } from './collectionAttribution/model';
export { CollectionPub } from './collectionPub/model';
export { Commenter } from './commenter/model';
export { Community } from './community/model';
export { CommunityAdmin } from './communityAdmin/model';
export { CrossrefDepositRecord } from './crossrefDepositRecord/model';
export { CustomScript } from './customScript/model';
export { DepositTarget } from './depositTarget/model';
export { Discussion } from './discussion/model';
export { DiscussionAnchor } from './discussionAnchor/model';
export { Doc } from './doc/model';
export { Draft } from './draft/model';
export { Export } from './export/model';
export { ExternalPublication } from './externalPublication/model';
export { FeatureFlag } from './featureFlag/model';
export { FeatureFlagUser } from './featureFlagUser/model';
export { FeatureFlagCommunity } from './featureFlagCommunity/model';
export { ZoteroIntegration } from './zoteroIntegration/model';
export { IntegrationDataOAuth1 } from './integrationDataOAuth1/model';
export { LandingPageFeature } from './landingPageFeature/model';
export { Member } from './member/model';
export { Merge } from './merge/model';
export { Organization } from './organization/model';
export { Page } from './page/model';
export { Pub } from './pub/model';
export { PubAttribution } from './pubAttribution/model';
export { PubEdge } from './pubEdge/model';
export { PubManager } from './pubManager/model';
export { PubVersion } from './pubVersion/model';
export { PublicPermissions } from './publicPermissions/model';
export { Release } from './release/model';
export { ReviewEvent } from './reviewEvent/model';
export { ScopeSummary } from './scopeSummary/model';
export { Submission } from './submission/model';
export { Signup } from './signup/model';
export { SpamTag } from './spamTag/model';
export { SubmissionWorkflow } from './submissionWorkflow/model';
export { ReviewNew } from './review/model';
export { Reviewer } from './reviewer/model';
export { Thread } from './thread/model';
export { ThreadComment } from './threadComment/model';
export { ThreadEvent } from './threadEvent/model';
export { User } from './user/model';
export { attributesPublicUser, includeUserModel } from './user/model';
export { UserDismissable } from './userDismissable/model';
export { UserNotification } from './userNotification/model';
export { UserNotificationPreferences } from './userNotificationPreferences/model';
export { UserScopeVisit } from './userScopeVisit/model';
export { UserSubscription } from './userSubscription/model';
export { ActivityItem } from './activityItem/model';
export { Visibility } from './visibility/model';
export { VisibilityUser } from './visibilityUser/model';
export { WorkerTask } from './workerTask/model';

export const { facetModels, FacetBinding } = createSequelizeModelsFromFacetDefinitions(sequelize);

/* Create associations for models that have associate function */
Object.values(sequelize.models).forEach((model) => {
	// @ts-expect-error (interpreting this file as vanilla JavaScript from test runner)
	const classMethods = model.options.classMethods || {};
	if (classMethods.associate) {
		classMethods.associate(sequelize.models);
	}
});

/** This export is here to guarantee that when you import the `sequelize` object
    all the models will be defined on it.

    In previous versions of Sequelize, the models were defined by importing it
    in the object using `Sequlize.import`. This is no longer the case, instead
    we first create the sequelize object and then import it in the relevant 
    `model.ts` file.

    TD:DR if you get "Model is not defined" errors, make sure you import the
    `sequelize` object from this file, not form `server/sequelize.ts`.
*/
export { sequelize };
