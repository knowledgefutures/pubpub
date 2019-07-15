/* eslint-disable no-console */
import Color from 'color';
import {
	Collection as v5_Collection,
	CollectionAttribution as v5_CollectionAttribution,
	CollectionPub as v5_CollectionPub,
	Community as v5_Community,
	CommunityAdmin as v5_CommunityAdmin,
	Discussion as v5_Discussion,
	// DiscussionChannel as v5_DiscussionChannel,
	// DiscussionChannelParticipant as v5_DiscussionChannelParticipant,
	Page as v5_Page,
	Pub as v5_Pub,
	// PubTag as v5_PubTag,
	PubAttribution as v5_PubAttribution,
	PubManager as v5_PubManager,
	Signup as v5_Signup,
	// Tag as v5_Tag,
	User as v5_User,
	// Version as v5_Version,
	// VersionPermission as v5_VersionPermission,
	WorkerTask as v5_WorkerTask,
} from '../v5/models';

import {
	// Branch as v6_Branch,
	// BranchPermission as v6_BranchPermission,
	Collection as v6_Collection,
	CollectionAttribution as v6_CollectionAttribution,
	CollectionPub as v6_CollectionPub,
	Community as v6_Community,
	CommunityAdmin as v6_CommunityAdmin,
	Discussion as v6_Discussion,
	// Merge as v6_Merge,
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

const simpleMap = (v5Model, v6Model) => {
	return v5Model.findAll().then((queryResult) => {
		const dataJSON = queryResult.map((item) => {
			return item.toJSON();
		});
		return v6Model.bulkCreate(dataJSON);
	});
};

Promise.all([])
	.then(() => {
		/* User */
		return simpleMap(v5_User, v6_User);
	})
	.then(() => {
		/* Community */
		console.log('Migrating Community');
		return v5_Community.findAll().then((queryResult) => {
			const dataJSON = queryResult.map((community) => {
				const accentWasLight = Color(community.accentColor).isLight();
				return {
					...community.toJSON(),
					accentColorLight: accentWasLight ? community.accentColor : '#FFFFFF',
					accentColorDark: !accentWasLight ? community.accentColor : '#000000',
					headerColorType: accentWasLight ? 'light' : 'dark',
				};
			});
			return v6_Community.bulkCreate(dataJSON);
		});
	})
	.then(() => {
		/* Page */
		console.log('Migrating Page');
		return simpleMap(v5_Page, v6_Page);
	})
	.then(() => {
		/* Pub */
		console.log('Migrating Pub');
		return v5_Pub.findAll().then((pubsData) => {
			const dataJSON = pubsData.map((pub) => {
				return {
					...pub.toJSON(),
					headerBackgroundType: pub.avatar && pub.useHeaderImage ? 'image' : 'color',
					headerBackgroundImage: pub.useHeaderImage ? pub.avatar : null,
				};
			});
			return v6_Pub.bulkCreate(dataJSON);
		});
	})
	.then(() => {
		/* Collection */
		console.log('Migrating Collection');
		return simpleMap(v5_Collection, v6_Collection);
	})
	.then(() => {
		/* CollectionAttribution */
		console.log('Migrating CollectionAttribution');
		return simpleMap(v5_CollectionAttribution, v6_CollectionAttribution);
	})
	.then(() => {
		/* CollectionPub */
		console.log('Migrating CollectionPub');
		return simpleMap(v5_CollectionPub, v6_CollectionPub);
	})

	.then(() => {
		/* CommunityAdmin */
		console.log('Migrating CommunityAdmin');
		return simpleMap(v5_CommunityAdmin, v6_CommunityAdmin);
	})
	.then(() => {
		/* Discussion */
		console.log('Migrating Discussion');
		return simpleMap(v5_Discussion, v6_Discussion);
	})
	.then(() => {
		/* PubAttribution */
		console.log('Migrating PubAttribution');
		return simpleMap(v5_PubAttribution, v6_PubAttribution);
	})
	.then(() => {
		/* PubManager */
		console.log('Migrating PubManager');
		return simpleMap(v5_PubManager, v6_PubManager);
	})
	.then(() => {
		/* Signup */
		console.log('Migrating Signup');
		return simpleMap(v5_Signup, v6_Signup);
	})
	.then(() => {
		/* WorkerTask */
		console.log('Migrating WorkerTask');
		return simpleMap(v5_WorkerTask, v6_WorkerTask);
	})
	.catch((err) => {
		console.log('Error with Migration', err);
	})
	.finally(() => {
		console.log('Ending Migration');
		process.exit();
	});
