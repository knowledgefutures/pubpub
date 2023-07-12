/* eslint-disable global-require */

import passportLocalSequelize from 'passport-local-sequelize';
import { createSequelizeModelsFromFacetDefinitions } from './facets/create';
import { sequelize } from './sequelize';

/* Import and create all models. */
/* Also import them to make them available to other modules */

import { CollectionAnyModel as Collection } from './collection/model';
import { CollectionAttributionAnyModel as CollectionAttribution } from './collectionAttribution/model';
import { CollectionPubAnyModel as CollectionPub } from './collectionPub/model';
import { CommenterAnyModel as Commenter } from './commenter/model';
import { CommunityAnyModel as Community } from './community/model';
import { CommunityAdminAnyModel as CommunityAdmin } from './communityAdmin/model';
import { CrossrefDepositRecordAnyModel as CrossrefDepositRecord } from './crossrefDepositRecord/model';
import { CustomScriptAnyModel as CustomScript } from './customScript/model';
import { DepositTargetAnyModel as DepositTarget } from './depositTarget/model';
import { DiscussionAnyModel as Discussion } from './discussion/model';
import { DiscussionAnchorAnyModel as DiscussionAnchor } from './discussionAnchor/model';
import { DocAnyModel as Doc } from './doc/model';
import { DraftAnyModel as Draft } from './draft/model';
import { ExportAnyModel as Export } from './export/model';
import { ExternalPublicationAnyModel as ExternalPublication } from './externalPublication/model';
import { FeatureFlagAnyModel as FeatureFlag } from './featureFlag/model';
import { FeatureFlagUserAnyModel as FeatureFlagUser } from './featureFlagUser/model';
import { FeatureFlagCommunityAnyModel as FeatureFlagCommunity } from './featureFlagCommunity/model';
import { ZoteroIntegrationAnyModel as ZoteroIntegration } from './zoteroIntegration/model';
import { IntegrationDataOAuth1AnyModel as IntegrationDataOAuth1 } from './integrationDataOAuth1/model';
import { LandingPageFeatureAnyModel as LandingPageFeature } from './landingPageFeature/model';
import { MemberAnyModel as Member } from './member/model';
import { MergeAnyModel as Merge } from './merge/model';
import { OrganizationAnyModel as Organization } from './organization/model';
import { PageAnyModel as Page } from './page/model';
import { PubAnyModel as Pub } from './pub/model';
import { PubAttributionAnyModel as PubAttribution } from './pubAttribution/model';
import { PubEdgeAnyModel as PubEdge } from './pubEdge/model';
import { PubManagerAnyModel as PubManager } from './pubManager/model';
import { PubVersionAnyModel as PubVersion } from './pubVersion/model';
import { PublicPermissionsAnyModel as PublicPermissions } from './publicPermissions/model';
import { ReleaseAnyModel as Release } from './release/model';
import { ReviewEventAnyModel as ReviewEvent } from './reviewEvent/model';
import { ScopeSummaryAnyModel as ScopeSummary } from './scopeSummary/model';
import { SubmissionAnyModel as Submission } from './submission/model';
import { SignupAnyModel as Signup } from './signup/model';
import { SpamTagAnyModel as SpamTag } from './spamTag/model';
import { SubmissionWorkflowAnyModel as SubmissionWorkflow } from './submissionWorkflow/model';
import { ReviewNewAnyModel as ReviewNew } from './review/model';
import { ReviewerAnyModel as Reviewer } from './reviewer/model';
import { ThreadAnyModel as Thread } from './thread/model';
import { ThreadCommentAnyModel as ThreadComment } from './threadComment/model';
import { ThreadEventAnyModel as ThreadEvent } from './threadEvent/model';
import { UserAnyModel as User } from './user/model';
import { UserDismissableAnyModel as UserDismissable } from './userDismissable/model';
import { UserNotificationAnyModel as UserNotification } from './userNotification/model';
import { UserNotificationPreferencesAnyModel as UserNotificationPreferences } from './userNotificationPreferences/model';
import { UserScopeVisitAnyModel as UserScopeVisit } from './userScopeVisit/model';
import { UserSubscriptionAnyModel as UserSubscription } from './userSubscription/model';
import { ActivityItemAnyModel as ActivityItem } from './activityItem/model';
import { VisibilityAnyModel as Visibility } from './visibility/model';
import { FacetBindingAnyModel as FacetBindingModel } from './facets/models/facetBinding';
import { VisibilityUserAnyModel as VisibilityUser } from './visibilityUser/model';
import { WorkerTaskAnyModel as WorkerTask } from './workerTask/model';

sequelize.addModels([
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
	ActivityItem,
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
];

export const includeUserModel = (() => {
	return (options) => {
		const { attributes: providedAttributes = [], ...restOptions } = options;
		const attributes = [...new Set([...attributesPublicUser, ...providedAttributes])];
		// eslint-disable-next-line pubpub-rules/no-user-model
		return {
			model: User,
			attributes,
			...restOptions,
		};
	};
})();

export {
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
	ActivityItem,
	Visibility,
	VisibilityUser,
	WorkerTask,
};

/** This import is here to guarantee that when you import the `sequelize` object
    all the models will be defined on it.

    In previous versions of Sequelize, the models were defined by importing it
    in the object using `Sequlize.import`. This is no longer the case, instead
    we first create the sequelize object and then import it in the relevant 
    `model.ts` file.

    TD:DR if you get "Model is not defined" errors, make sure you import the
    `sequelize` object from this file, not form `server/sequelize.ts`.
*/
export { sequelize };
