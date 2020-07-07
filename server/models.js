/* eslint-disable global-require */
import Sequelize from 'sequelize';
import { createIncludeUserModel } from './utils/queryHelpers/includeUserModel';

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
	require('./config.js');
}

const useSSL = process.env.DATABASE_URL.indexOf('localhost') === -1;
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
export const Branch = sequelize.import('./branch/model.js');
export const BranchPermission = sequelize.import('./branchPermission/model.js');
export const Collection = sequelize.import('./collection/model.js');
export const CollectionAttribution = sequelize.import('./collectionAttribution/model.js');
export const CollectionPub = sequelize.import('./collectionPub/model.js');
export const Community = sequelize.import('./community/model.js');
export const CommunityAdmin = sequelize.import('./communityAdmin/model.js');
export const Discussion = sequelize.import('./discussion/model.js');
export const Doc = sequelize.import('./doc/model.js');
export const Export = sequelize.import('./export/model.js');
export const ExternalPublication = sequelize.import('./externalPublication/model.js');
export const Member = sequelize.import('./member/model.js');
export const Merge = sequelize.import('./merge/model.js');
export const Organization = sequelize.import('./organization/model.js');
export const Page = sequelize.import('./page/model.js');
export const Pub = sequelize.import('./pub/model.js');
export const PubAttribution = sequelize.import('./pubAttribution/model.js');
export const PubEdge = sequelize.import('./pubEdge/model.js');
export const PubManager = sequelize.import('./pubManager/model.js');
export const PubVersion = sequelize.import('./pubVersion/model.js');
export const PublicPermissions = sequelize.import('./publicPermissions/model.js');
export const Release = sequelize.import('./release/model.js');
export const Review = sequelize.import('./review/model.js');
export const ReviewEvent = sequelize.import('./reviewEvent/model.js');
export const Signup = sequelize.import('./signup/model.js');
// export const Thread = sequelize.import('./thread/model.js');
// export const ThreadAnchor = sequelize.import('./threadAnchor/model.js');
// export const ThreadComment = sequelize.import('./threadComment/model.js');
// export const ThreadUser = sequelize.import('./threadUser/model.js');

export const DiscussionNew = sequelize.import('./discussion/modelNew.js');
export const Anchor = sequelize.import('./anchor/model.js');
export const ReviewNew = sequelize.import('./review/modelNew.js');
export const Fork = sequelize.import('./fork/model.js');
export const Thread = sequelize.import('./thread/model.js');
export const ThreadComment = sequelize.import('./threadComment/model.js');
export const ThreadEvent = sequelize.import('./threadEvent/model.js');
export const Visibility = sequelize.import('./visibility/model.js');
export const VisibilityUser = sequelize.import('./visibilityUser/model.js');

export const User = sequelize.import('./user/model.js');
export const WorkerTask = sequelize.import('./workerTask/model.js');

export const includeUserModel = createIncludeUserModel(User);

/* Create associations for models that have associate function */
Object.values(sequelize.models).forEach((model) => {
	const classMethods = model.options.classMethods || {};
	if (classMethods.associate) {
		classMethods.associate(sequelize.models);
	}
});
