/* eslint-disable global-require */
import path from 'path';
import Sequelize from 'sequelize';
import knexJs from 'knex';

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
	require(path.join(process.cwd(), 'config.js'));
}

// @ts-expect-error (interpreting this file as vanilla JavaScript from test runner)
const useSSL = process.env.DATABASE_URL.indexOf('localhost') === -1;
// @ts-expect-error (interpreting this file as vanilla JavaScript from test runner)
export const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
	dialectOptions: { ssl: useSSL ? { rejectUnauthorized: false } : false },
	pool: {
		max: process.env.SEQUELIZE_MAX_CONNECTIONS
			? parseInt(process.env.SEQUELIZE_MAX_CONNECTIONS, 10)
			: 5, // Some migrations require this number to be 150
		// idle: 20000,
		// acquire: 20000,
	},
});

export const knex = knexJs({ client: 'pg' });

/* Change to true to update the model in the database. */
/* NOTE: This being set to true will erase your data. */
if (process.env.NODE_ENV !== 'test') {
	sequelize.sync({ force: false });
}

/* Create standard id type for our database */
sequelize.idType = {
	primaryKey: true,
	type: Sequelize.UUID,
	defaultValue: Sequelize.UUIDV4,
};

/* Import and create all models. */
/* Also export them to make them available to other modules */
export const Collection = sequelize.import('./collection/model');
export const CollectionAttribution = sequelize.import('./collectionAttribution/model');
export const CollectionPub = sequelize.import('./collectionPub/model');
export const Community = sequelize.import('./community/model');
export const CommunityAdmin = sequelize.import('./communityAdmin/model');
export const CrossrefDepositRecord = sequelize.import('./crossrefDepositRecord/model');
export const CustomScript = sequelize.import('./customScript/model');
export const Discussion = sequelize.import('./discussion/model');
export const DiscussionAnchor = sequelize.import('./discussionAnchor/model');
export const Doc = sequelize.import('./doc/model');
export const Draft = sequelize.import('./draft/model');
export const Export = sequelize.import('./export/model');
export const ExternalPublication = sequelize.import('./externalPublication/model');
export const FeatureFlag = sequelize.import('./featureFlag/model');
export const FeatureFlagUser = sequelize.import('./featureFlagUser/model');
export const FeatureFlagCommunity = sequelize.import('./featureFlagCommunity/model');
export const Member = sequelize.import('./member/model');
export const Merge = sequelize.import('./merge/model');
export const Organization = sequelize.import('./organization/model');
export const Page = sequelize.import('./page/model');
export const Pub = sequelize.import('./pub/model');
export const PubAttribution = sequelize.import('./pubAttribution/model');
export const PubEdge = sequelize.import('./pubEdge/model');
export const PubManager = sequelize.import('./pubManager/model');
export const PubVersion = sequelize.import('./pubVersion/model');
export const PublicPermissions = sequelize.import('./publicPermissions/model');
export const Release = sequelize.import('./release/model');
export const Review = sequelize.import('./review/model');
export const ReviewEvent = sequelize.import('./reviewEvent/model');
export const ScopeSummary = sequelize.import('./scopeSummary/model');
export const Submission = sequelize.import('./submission/model');
export const Signup = sequelize.import('./signup/model');
export const SubmissionWorkflow = sequelize.import('./submissionWorkflow/model');
export const ReviewNew = sequelize.import('./review/modelNew');
export const Thread = sequelize.import('./thread/model');
export const ThreadComment = sequelize.import('./threadComment/model');
export const ThreadEvent = sequelize.import('./threadEvent/model');
export const User = sequelize.import('./user/model');
export const UserNotification = sequelize.import('./userNotification/model');
export const UserNotificationPreferences = sequelize.import('./userNotificationPreferences/model');
export const UserScopeVisit = sequelize.import('./userScopeVisit/model');
export const UserSubscription = sequelize.import('./userSubscription/model');
export const ActivityItem = sequelize.import('./activityItem/model');
export const Visibility = sequelize.import('./visibility/model');
export const VisibilityUser = sequelize.import('./visibilityUser/model');
export const WorkerTask = sequelize.import('./workerTask/model');

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
	return ({ attributes: providedAttributes = [] as string[], ...restOptions }) => {
		const attributes = [...new Set([...attributesPublicUser, ...providedAttributes])];
		// eslint-disable-next-line pubpub-rules/no-user-model
		return {
			model: User,
			attributes,
			...restOptions,
		};
	};
})();

/* Create associations for models that have associate function */
Object.values(sequelize.models).forEach((model) => {
	// @ts-expect-error (interpreting this file as vanilla JavaScript from test runner)
	const classMethods = model.options.classMethods || {};
	if (classMethods.associate) {
		classMethods.associate(sequelize.models);
	}
});
