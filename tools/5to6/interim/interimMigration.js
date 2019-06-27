/* eslint-disable */
import { Op } from 'sequelize';
import Color from 'color';
import {
	Collection as v5_Collection,
	CollectionAttribution as v5_CollectionAttribution,
	CollectionPub as v5_CollectionPub,
	Community as v5_Community,
	CommunityAdmin as v5_CommunityAdmin,
	Discussion as v5_Discussion,
	DiscussionChannel as v5_DiscussionChannel,
	DiscussionChannelParticipant as v5_DiscussionChannelParticipant,
	Page as v5_Page,
	Pub as v5_Pub,
	PubTag as v5_PubTag,
	PubAttribution as v5_PubAttribution,
	PubManager as v5_PubManager,
	Signup as v5_Signup,
	Tag as v5_Tag,
	User as v5_User,
	Version as v5_Version,
	VersionPermission as v5_VersionPermission,
	WorkerTask as v5_WorkerTask,
} from '../v5/models';

import {
	Branch as v6_Branch,
	BranchPermission as v6_BranchPermission,
	Collection as v6_Collection,
	CollectionAttribution as v6_CollectionAttribution,
	CollectionPub as v6_CollectionPub,
	Community as v6_Community,
	CommunityAdmin as v6_CommunityAdmin,
	Discussion as v6_Discussion,
	Merge as v6_Merge,
	Page as v6_Page,
	Pub as v6_Pub,
	PubAttribution as v6_PubAttribution,
	PubManager as v6_PubManager,
	// PubVersion as v6_PubVersion,
	// PubTag as v6_PubTag,
	Signup as v6_Signup,
	// Review as v6_Review,
	// ReviewEvent as v6_ReviewEvent,
	// Tag as v6_Tag,
	User as v6_User,
	// Version as v6_Version,
	// VersionPermission as v6_VersionPermission,
	WorkerTask as v6_WorkerTask,
} from '../../../server/models';

import {
	Branch as v7_Branch,
	BranchPermission as v7_BranchPermission,
	Collection as v7_Collection,
	CollectionAttribution as v7_CollectionAttribution,
	CollectionPub as v7_CollectionPub,
	Community as v7_Community,
	CommunityAdmin as v7_CommunityAdmin,
	Discussion as v7_Discussion,
	DiscussionChannel as v7_DiscussionChannel,
	DiscussionChannelParticipant as v7_DiscussionChannelParticipant,
	Merge as v7_Merge,
	Page as v7_Page,
	Pub as v7_Pub,
	PubTag as v7_PubTag,
	PubAttribution as v7_PubAttribution,
	PubManager as v7_PubManager,
	Signup as v7_Signup,
	Tag as v7_Tag,
	User as v7_User,
	Version as v7_Version,
	VersionPermission as v7_VersionPermission,
	WorkerTask as v7_WorkerTask,
} from './v7_models';

// const simpleMap = (v5Model, v6Model) => {
// 	return v5Model.findAll().then((queryResult) => {
// 		const dataJSON = queryResult.map((item) => {
// 			return item.toJSON();
// 		});
// 		return v6Model.bulkCreate(dataJSON);
// 	});
// };

const simpleV5Map = (v5Model, v7Model) => {
	return v5Model.findAll().then((queryResult) => {
		const dataJSON = queryResult.map((item) => {
			return item.toJSON();
		});
		return v7Model.bulkCreate(dataJSON);
	});
};

Promise.all([])
	/* Map all v5 data */
	// .then(() => {
	// 	console.log('Starting v5m_Signup');
	// 	return simpleV5Map(v5_Signup, v7_Signup);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_User');
	// 	return simpleV5Map(v5_User, v7_User);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_Community');
	// 	return simpleV5Map(v5_Community, v7_Community);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_Page');
	// 	return simpleV5Map(v5_Page, v7_Page);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_Pub');
	// 	return simpleV5Map(v5_Pub, v7_Pub);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_Collection');
	// 	return simpleV5Map(v5_Collection, v7_Collection);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_CollectionAttribution');
	// 	return simpleV5Map(v5_CollectionAttribution, v7_CollectionAttribution);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_CollectionPub');
	// 	return simpleV5Map(v5_CollectionPub, v7_CollectionPub);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_CommunityAdmin');
	// 	return simpleV5Map(v5_CommunityAdmin, v7_CommunityAdmin);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_DiscussionChannel');
	// 	return simpleV5Map(v5_DiscussionChannel, v7_DiscussionChannel);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_Discussion');
	// 	return simpleV5Map(v5_Discussion, v7_Discussion);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_DiscussionChannelParticipant');
	// 	return simpleV5Map(v5_DiscussionChannelParticipant, v7_DiscussionChannelParticipant);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_PubTag');
	// 	return simpleV5Map(v5_PubTag, v7_PubTag);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_PubAttribution');
	// 	return simpleV5Map(v5_PubAttribution, v7_PubAttribution);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_PubManager');
	// 	return simpleV5Map(v5_PubManager, v7_PubManager);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_Tag');
	// 	return simpleV5Map(v5_Tag, v7_Tag);
	// })
	// // .then(() => {
	// // 	console.log('Starting v5m_v5d_Version');
	// // 	return simpleV5Map(v5_Version, v7_Version);
	// // })
	// .then(() => {
	// 	console.log('Starting v5 versions 1');
	// 	return v5_Version
	// 		.findAll({
	// 			order: [['createdAt', 'DESC']],
	// 			limit: 1500,
	// 			offset: 0,
	// 		})
	// 		.then((queryResult) => {
	// 			const dataJSON = queryResult.map((item) => {
	// 				return item.toJSON();
	// 			});
	// 			return v7_Version.bulkCreate(dataJSON);
	// 		});
	// })
	// .then(() => {
	// 	console.log('Starting v5 versions 2');
	// 	return v5_Version
	// 		.findAll({
	// 			order: [['createdAt', 'DESC']],
	// 			limit: 1500,
	// 			offset: 1500,
	// 		})
	// 		.then((queryResult) => {
	// 			const dataJSON = queryResult.map((item) => {
	// 				return item.toJSON();
	// 			});
	// 			return v7_Version.bulkCreate(dataJSON);
	// 		});
	// })
	// .then(() => {
	// 	console.log('Starting v5 versions 3');
	// 	return v5_Version
	// 		.findAll({
	// 			order: [['createdAt', 'DESC']],
	// 			limit: 1500,
	// 			offset: 3000,
	// 		})
	// 		.then((queryResult) => {
	// 			const dataJSON = queryResult.map((item) => {
	// 				return item.toJSON();
	// 			});
	// 			return v7_Version.bulkCreate(dataJSON);
	// 		});
	// })
	// .then(() => {
	// 	console.log('Starting v5 versions 4');
	// 	return v5_Version
	// 		.findAll({
	// 			order: [['createdAt', 'DESC']],
	// 			limit: 1500,
	// 			offset: 4500,
	// 		})
	// 		.then((queryResult) => {
	// 			const dataJSON = queryResult.map((item) => {
	// 				return item.toJSON();
	// 			});
	// 			return v7_Version.bulkCreate(dataJSON);
	// 		});
	// })
	// .then(() => {
	// 	console.log('Starting v5 versions 5');
	// 	return v5_Version
	// 		.findAll({
	// 			order: [['createdAt', 'DESC']],
	// 			limit: 1500,
	// 			offset: 6000,
	// 		})
	// 		.then((queryResult) => {
	// 			const dataJSON = queryResult.map((item) => {
	// 				return item.toJSON();
	// 			});
	// 			return v7_Version.bulkCreate(dataJSON);
	// 		});
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_VersionPermission');
	// 	return simpleV5Map(v5_VersionPermission, v7_VersionPermission);
	// })
	// .then(() => {
	// 	console.log('Starting v5m_v5d_WorkerTask');
	// 	return simpleV5Map(v5_WorkerTask, v7_WorkerTask);
	// })

	/* Begin v6 -> v7 migration */
	.then(() => {
		console.log('Find v6 HDSR Pages');
		return v6_Page.findAll({
			where: {
				communityId: '99608f92-d70f-46c1-a72c-df272215f13e',
			},
		});
	})
	.then((hdsrV6Pages) => {
		console.log('Update v6 HDSR Pages');
		const updateQueries = hdsrV6Pages.map((v6Page) => {
			return v7_Page.update(v6Page.toJSON(), {
				where: { id: v6Page.id },
			});
		});
		return Promise.all(updateQueries);
	})
	.then(() => {
		console.log('Find v6 HDSR Pubs');
		return v6_Pub.findAll({
			where: {
				communityId: '99608f92-d70f-46c1-a72c-df272215f13e',
			},
		});
	})
	.then((hdsrV6Pubs) => {
		console.log(hdsrV6Pubs.length);
		console.log('Update v6 HDSR Pubs');
		const updateQueries = hdsrV6Pubs.map((v6Pub) => {
			return v7_Pub.update(v6Pub.toJSON(), {
				where: { id: v6Pub.id },
			});
		});
		console.log('huh');
		const hdsrPubIds = hdsrV6Pubs.map((v6Pub) => {
			return v6Pub.id;
		});
		return Promise.all([hdsrPubIds, ...updateQueries]);
	})
	.then(([hdsrPubIds]) => {
		console.log('hi', hdsrPubIds);
		const findBranches = v6_Branch.findAll({
			where: {
				pubId: { [Op.in]: hdsrPubIds },
			},
		});
		const findBranchPermissions = v6_BranchPermission.findAll({
			where: {
				pubId: { [Op.in]: hdsrPubIds },
			},
		});
		const findMerges = v6_Merge.findAll({
			where: {
				pubId: { [Op.in]: hdsrPubIds },
			},
		});
		return Promise.all([findBranches, findBranchPermissions, findMerges]);
	})
	.then(([branches, branchPermissions, merges]) => {
		console.log('Create branch, branchpermissions, and merges');
		return Promise.all([
			v7_Branch.bulkCreate(branches.map((item) => item.toJSON())),
			v7_BranchPermission.bulkCreate(branchPermissions.map((item) => item.toJSON())),
			v7_Merge.bulkCreate(merges.map((item) => item.toJSON())),
		]);
	})
	.then(() => {
		console.log('Find v6 HDSR Community');
		return v6_Community.findOne({
			where: {
				id: '99608f92-d70f-46c1-a72c-df272215f13e',
			},
		});
	})
	.then((hdsrV6Community) => {
		/* Update v6 HDSR Community */
		return v7_Community.update(hdsrV6Community.toJSON(), {
			where: { id: hdsrV6Community.id },
		});
	})

	.catch((err) => {
		console.log('Error with Migration', err);
	})
	.finally(() => {
		console.log('Ending Migration');
		process.exit();
	});

// .then(() => {
// 	/* User */
// 	return simpleMap(v5_User, v6_User);
// })
// .then(() => {
// 	/* Community */
// 	console.log('Migrating Community');
// 	return v5_Community.findAll().then((queryResult) => {
// 		const dataJSON = queryResult.map((community) => {
// 			const accentWasLight = Color(community.accentColor).isLight();
// 			return {
// 				...community.toJSON(),
// 				accentColorLight: accentWasLight ? community.accentColor : '#FFFFFF',
// 				accentColorDark: !accentWasLight ? community.accentColor : '#000000',
// 				headerColorType: accentWasLight ? 'light' : 'dark',
// 			};
// 		});
// 		return v6_Community.bulkCreate(dataJSON);
// 	});
// })
// .then(() => {
// 	/* Page */
// 	console.log('Migrating Page');
// 	return simpleMap(v5_Page, v6_Page);
// })
// .then(() => {
// 	/* Pub */
// 	console.log('Migrating Pub');
// 	return v5_Pub.findAll().then((pubsData) => {
// 		const dataJSON = pubsData.map((pub) => {
// 			return {
// 				...pub.toJSON(),
// 				headerBackgroundType: pub.avatar && pub.useHeaderImage ? 'image' : 'color',
// 				headerBackgroundImage: pub.useHeaderImage ? pub.avatar : null,
// 			};
// 		});
// 		return v6_Pub.bulkCreate(dataJSON);
// 	});
// })
// .then(() => {
// 	/* Collection */
// 	console.log('Migrating Collection');
// 	return simpleMap(v5_Collection, v6_Collection);
// })
// .then(() => {
// 	/* CollectionAttribution */
// 	console.log('Migrating CollectionAttribution');
// 	return simpleMap(v5_CollectionAttribution, v6_CollectionAttribution);
// })
// .then(() => {
// 	/* CollectionPub */
// 	console.log('Migrating CollectionPub');
// 	return simpleMap(v5_CollectionPub, v6_CollectionPub);
// })

// .then(() => {
// 	/* CommunityAdmin */
// 	console.log('Migrating CommunityAdmin');
// 	return simpleMap(v5_CommunityAdmin, v6_CommunityAdmin);
// })
// .then(() => {
// 	/* Discussion */
// 	console.log('Migrating Discussion');
// 	return simpleMap(v5_Discussion, v6_Discussion);
// })
// .then(() => {
// 	/* PubAttribution */
// 	console.log('Migrating PubAttribution');
// 	return simpleMap(v5_PubAttribution, v6_PubAttribution);
// })
// .then(() => {
// 	/* PubManager */
// 	console.log('Migrating PubManager');
// 	return simpleMap(v5_PubManager, v6_PubManager);
// })
// .then(() => {
// 	/* Signup */
// 	console.log('Migrating Signup');
// 	return simpleMap(v5_Signup, v6_Signup);
// })
// .then(() => {
// 	/* WorkerTask */
// 	console.log('Migrating WorkerTask');
// 	return simpleMap(v5_WorkerTask, v6_WorkerTask);
// })
// .catch((err) => {
// 	console.log('Error with Migration', err);
// })
// .finally(() => {
// 	console.log('Ending Migration');
// 	process.exit();
// });
