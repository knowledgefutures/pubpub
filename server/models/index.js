/* eslint-disable global-require */
import Sequelize from 'sequelize';

if (process.env.NODE_ENV !== 'production') {
	require('../config.js');
}

const useSSL = process.env.DATABASE_URL.indexOf('localhost') === -1;
export const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
	dialectOptions: { ssl: useSSL },
});

/* Change to true to update the model in the database. */
/* NOTE: This being set to true will erase your data. */
sequelize.sync({ force: false });

/* Create standard id type for our database */
sequelize.idType = {
	primaryKey: true,
	type: Sequelize.UUID,
	defaultValue: Sequelize.UUIDV4,
};

/* Import and create all models. */
/* Also export them to make them available to other modules */
export const Branch = sequelize.import('../branch/model.js');
export const BranchPermission = sequelize.import('../branchPermission/model.js');
export const Collection = sequelize.import('./collection.js');
export const CollectionAttribution = sequelize.import('./collectionAttribution.js');
export const CollectionPub = sequelize.import('./collectionPub.js');
export const Community = sequelize.import('./community.js');
export const CommunityAdmin = sequelize.import('./communityAdmin.js');
export const Discussion = sequelize.import('./discussion.js');
export const DiscussionChannel = sequelize.import('./discussionChannel.js');
export const DiscussionChannelParticipant = sequelize.import('./discussionChannelParticipant.js');
export const Page = sequelize.import('./page.js');
export const Pub = sequelize.import('./pub.js');
export const PubAttribution = sequelize.import('./pubAttribution.js');
export const PubManager = sequelize.import('./pubManager.js');
export const PubTag = sequelize.import('./pubTag.js');
export const Signup = sequelize.import('./signup.js');
export const Review = sequelize.import('../review/model.js');
export const Tag = sequelize.import('./tag.js');
export const User = sequelize.import('./user.js');
export const Version = sequelize.import('./version.js');
export const VersionPermission = sequelize.import('./versionPermission.js');
export const WorkerTask = sequelize.import('./workerTask.js');

/* Create associations for models that have associate function */
Object.values(sequelize.models).forEach((model) => {
	const classMethods = model.options.classMethods || {};
	if (classMethods.associate) {
		classMethods.associate(sequelize.models);
	}
});
