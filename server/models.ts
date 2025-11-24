import passportLocalSequelize from 'passport-local-sequelize';

import { createSequelizeModelsFromFacetDefinitions } from './facets/create';
import { sequelize } from './sequelize';

/* Import and create all models. */
/* Also import them to make them available to other modules */

import { ActivityItem } from './activityItem/model';
import { AuthToken } from './authToken/model';
import { Collection } from './collection/model';
import { CollectionAttribution } from './collectionAttribution/model';
import { CollectionPub } from './collectionPub/model';
import { Commenter } from './commenter/model';
import { Community } from './community/model';
import { CommunityAdmin } from './communityAdmin/model';
import { CrossrefDepositRecord } from './crossrefDepositRecord/model';
import { CustomScript } from './customScript/model';
import { DepositTarget } from './depositTarget/model';
import { Discussion } from './discussion/model';
import { DiscussionAnchor } from './discussionAnchor/model';
import { Doc } from './doc/model';
import { Draft } from './draft/model';
import { Export } from './export/model';
import { ExternalPublication } from './externalPublication/model';
import { FacetBinding as FacetBindingModel } from './facets/models/facetBinding';
import { FeatureFlag } from './featureFlag/model';
import { FeatureFlagCommunity } from './featureFlagCommunity/model';
import { FeatureFlagUser } from './featureFlagUser/model';
import { IntegrationDataOAuth1 } from './integrationDataOAuth1/model';
import { LandingPageFeature } from './landingPageFeature/model';
import { Member } from './member/model';
import { Merge } from './merge/model';
import { Organization } from './organization/model';
import { Page } from './page/model';
import { Pub } from './pub/model';
import { PubAttribution } from './pubAttribution/model';
import { PubEdge } from './pubEdge/model';
import { PublicPermissions } from './publicPermissions/model';
import { PubManager } from './pubManager/model';
import { PubVersion } from './pubVersion/model';
import { Release } from './release/model';
import { ReviewNew } from './review/model';
import { ReviewEvent } from './reviewEvent/model';
import { Reviewer } from './reviewer/model';
import { ScopeSummary } from './scopeSummary/model';
import { Signup } from './signup/model';
import { SpamTag } from './spamTag/model';
import { Submission } from './submission/model';
import { SubmissionWorkflow } from './submissionWorkflow/model';
import { Thread } from './thread/model';
import { ThreadComment } from './threadComment/model';
import { ThreadEvent } from './threadEvent/model';
import { User } from './user/model';
import { UserDismissable } from './userDismissable/model';
import { UserNotification } from './userNotification/model';
import { UserNotificationPreferences } from './userNotificationPreferences/model';
import { UserScopeVisit } from './userScopeVisit/model';
import { UserSubscription } from './userSubscription/model';
import { Visibility } from './visibility/model';
import { VisibilityUser } from './visibilityUser/model';
import { WorkerTask } from './workerTask/model';
import { ZoteroIntegration } from './zoteroIntegration/model';

sequelize.addModels([
	ActivityItem,
	AuthToken,
	Collection,
	CollectionAttribution,
	CollectionPub,
	Commenter,
	Community,
	CommunityAdmin,
	CrossrefDepositRecord,
	CustomScript,
	DepositTarget,
	Discussion,
	DiscussionAnchor,
	Doc,
	Draft,
	Export,
	ExternalPublication,
	FacetBindingModel,
	FeatureFlag,
	FeatureFlagUser,
	FeatureFlagCommunity,
	ZoteroIntegration,
	IntegrationDataOAuth1,
	LandingPageFeature,
	Member,
	Merge,
	Organization,
	Page,
	Pub,
	PubAttribution,
	PubEdge,
	PubManager,
	PubVersion,
	PublicPermissions,
	Release,
	ReviewEvent,
	ScopeSummary,
	Submission,
	Signup,
	SpamTag,
	SubmissionWorkflow,
	ReviewNew,
	Reviewer,
	Thread,
	ThreadComment,
	ThreadEvent,
	User,
	UserDismissable,
	UserNotification,
	UserNotificationPreferences,
	UserScopeVisit,
	UserSubscription,
	Visibility,
	VisibilityUser,
	WorkerTask,
]);

export const { facetModels, FacetBinding } = createSequelizeModelsFromFacetDefinitions(sequelize);

passportLocalSequelize.attachToUser(User, {
	usernameField: 'email',
	hashField: 'hash',
	saltField: 'salt',
	digest: 'sha512',
	iterations: 25000,
});

export const attributesPublicUser = [
	'id',
	'firstName',
	'lastName',
	'fullName',
	'avatar',
	'slug',
	'initials',
	'title',
	'orcid',
] as const;

export const includeUserModel = (() => {
	return (options) => {
		const { attributes: providedAttributes = [], ...restOptions } = options;
		const attributes = [...new Set([...attributesPublicUser, ...providedAttributes])];

		return {
			model: User,
			attributes,
			...restOptions,
		};
	};
})();

export {
	ActivityItem,
	AuthToken,
	Collection,
	CollectionAttribution,
	CollectionPub,
	Commenter,
	Community,
	CommunityAdmin,
	CrossrefDepositRecord,
	CustomScript,
	DepositTarget,
	Discussion,
	DiscussionAnchor,
	Doc,
	Draft,
	Export,
	ExternalPublication,
	FeatureFlag,
	FeatureFlagCommunity,
	FeatureFlagUser,
	IntegrationDataOAuth1,
	LandingPageFeature,
	Member,
	Merge,
	Organization,
	Page,
	Pub,
	PubAttribution,
	PubEdge,
	PublicPermissions,
	PubManager,
	PubVersion,
	Release,
	Reviewer,
	ReviewEvent,
	ReviewNew,
	ScopeSummary,
	Signup,
	SpamTag,
	Submission,
	SubmissionWorkflow,
	Thread,
	ThreadComment,
	ThreadEvent,
	User,
	UserDismissable,
	UserNotification,
	UserNotificationPreferences,
	UserScopeVisit,
	UserSubscription,
	Visibility,
	VisibilityUser,
	WorkerTask,
	ZoteroIntegration,
};

/**
 * This import is here to guarantee that when you import the `sequelize` object all the models will
 * be defined on it.
 *
 * ```
 * In previous versions of Sequelize, the models were defined by importing it
 * in the object using `Sequlize.import`. This is no longer the case, instead
 * we first create the sequelize object and then import it in the relevant
 * `model.ts` file.
 *
 * TD:DR if you get "Model is not defined" errors, make sure you import the
 * `sequelize` object from this file, not form `server/sequelize.ts`.
 * ```
 */
export { sequelize };
