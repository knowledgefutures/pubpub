/* eslint-disable global-require */
import Sequelize from 'sequelize';

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
	require('./config.js');
}

const useSSL = process.env.DATABASE_URL.indexOf('localhost') === -1;
export const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
	dialectOptions: { ssl: useSSL },
	pool: {
		max: process.env.SEQUELIZE_MAX_CONNECTIONS
			? parseInt(process.env.SEQUELIZE_MAX_CONNECTIONS, 10)
			: 5,
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
export const Export = sequelize.import('./export/model.js');
export const Member = sequelize.import('./member/model.js');
export const Merge = sequelize.import('./merge/model.js');
export const Organization = sequelize.import('./organization/model.js');
export const Page = sequelize.import('./page/model.js');
export const Pub = sequelize.import('./pub/model.js');
export const PubAttribution = sequelize.import('./pubAttribution/model.js');
export const PubManager = sequelize.import('./pubManager/model.js');
export const PubVersion = sequelize.import('./pubVersion/model.js');
export const ScopeOptions = sequelize.import('./scopeOptions/model.js');
export const Signup = sequelize.import('./signup/model.js');
export const Review = sequelize.import('./review/model.js');
export const ReviewEvent = sequelize.import('./reviewEvent/model.js');
export const User = sequelize.import('./user/model.js');
export const WorkerTask = sequelize.import('./workerTask/model.js');

/* Create associations for models that have associate function */
Object.values(sequelize.models).forEach((model) => {
	const classMethods = model.options.classMethods || {};
	if (classMethods.associate) {
		classMethods.associate(sequelize.models);
	}
});
