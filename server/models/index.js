/* eslint-disable global-require */
import Sequelize from 'sequelize';

if (process.env.NODE_ENV !== 'production') {
	require('../config.js');
}

// const operatorsAliases = {
// 	$or: Sequelize.Op.or,
// 	$and: Sequelize.Op.and,
// 	$ilike: Sequelize.Op.iLike,
// 	$in: Sequelize.Op.in,
// 	$not: Sequelize.Op.not,
// 	$notIn: Sequelize.Op.notIn,
// 	$eq: Sequelize.Op.eq,
// 	$ne: Sequelize.Op.ne,
// 	$lt: Sequelize.Op.lt,
// 	$gt: Sequelize.Op.gt,
// };
const useSSL = process.env.DATABASE_URL.indexOf('localhost') === -1;
const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
	dialectOptions: { ssl: useSSL },
	// operatorsAliases: false,
});

// Change to true to update the model in the database.
// NOTE: This being set to true will erase your data.
sequelize.sync({ force: false });

/* Create standard id type for our database */
sequelize.idType = {
	primaryKey: true,
	type: Sequelize.UUID,
	defaultValue: Sequelize.UUIDV4,
};

/* Import and create all models */
sequelize.import('./branch.js');
sequelize.import('./branchPermission.js');
sequelize.import('./collection.js');
sequelize.import('./collectionAttribution.js');
sequelize.import('./collectionPub.js');
sequelize.import('./community.js');
sequelize.import('./communityAdmin.js');
sequelize.import('./discussion.js');
sequelize.import('./discussionChannel.js');
sequelize.import('./discussionChannelParticipant.js');
sequelize.import('./page.js');
sequelize.import('./pub.js');
sequelize.import('./pubAttribution.js');
sequelize.import('./pubManager.js');
sequelize.import('./pubTag.js');
sequelize.import('./signup.js');
sequelize.import('./tag.js');
sequelize.import('./user.js');
sequelize.import('./version.js');
sequelize.import('./versionPermission.js');
sequelize.import('./workerTask.js');

/* Create associations for models that have associate function */
Object.values(sequelize.models).forEach((model) => {
	const classMethods = model.options.classMethods || {};
	if (classMethods.associate) {
		classMethods.associate(sequelize.models);
	}
});

module.exports = {
	...sequelize.models,
	sequelize: sequelize,
};
