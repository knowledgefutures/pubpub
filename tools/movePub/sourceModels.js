import Sequelize from 'sequelize';

require('../../server/config.js');

const useSSL = process.env.DATABASE_URL.indexOf('localhost') === -1;
export const sequelize = new Sequelize(process.env.DATABASE_URL_v6Dev, {
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
export const Branch = sequelize.import('../../server/branch/model.js');
export const BranchPermission = sequelize.import('../../server/branchPermission/model.js');
export const Collection = sequelize.import('../../server/collection/model.js');
export const CollectionAttribution = sequelize.import(
	'../../server/collectionAttribution/model.js',
);
export const CollectionPub = sequelize.import('../../server/collectionPub/model.js');
export const Community = sequelize.import('../../server/community/model.js');
export const CommunityAdmin = sequelize.import('../../server/communityAdmin/model.js');
export const Discussion = sequelize.import('../../server/discussion/model.js');
export const Merge = sequelize.import('../../server/merge/model.js');
export const Page = sequelize.import('../../server/page/model.js');
export const Pub = sequelize.import('../../server/pub/model.js');
export const PubAttribution = sequelize.import('../../server/pubAttribution/model.js');
export const PubManager = sequelize.import('../../server/pubManager/model.js');
export const PubVersion = sequelize.import('../../server/pubVersion/model.js');
export const Signup = sequelize.import('../../server/signup/model.js');
export const Review = sequelize.import('../../server/review/model.js');
export const ReviewEvent = sequelize.import('../../server/reviewEvent/model.js');
export const User = sequelize.import('../../server/user/model.js');
export const WorkerTask = sequelize.import('../../server/workerTask/model.js');

/* Create associations for models that have associate function */
Object.values(sequelize.models).forEach((model) => {
	const classMethods = model.options.classMethods || {};
	if (classMethods.associate) {
		classMethods.associate(sequelize.models);
	}
});
