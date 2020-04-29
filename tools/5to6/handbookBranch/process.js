/* eslint-disable */

import { Op } from 'sequelize';
import Color from 'color';
import uuidv4 from 'uuid/v4';
import Promise from 'bluebird';
import firebaseAdmin from 'firebase-admin';
import { createBranch } from 'components/Editor';
import {
	DiscussionChannel as v5_DiscussionChannel,
	DiscussionChannelParticipant as v5_DiscussionChannelParticipant,
} from '../v5/models';

import {
	Branch as v6_Branch,
	BranchPermission as v6_BranchPermission,
	Pub as v6_Pub,
} from '../../../server/models';

const serviceAccount = JSON.parse(
	Buffer.from(process.env.V6_FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
);

function generateHash(length) {
	const tokenLength = length || 32;
	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

	let hash = '';
	for (let index = 0; index < tokenLength; index += 1) {
		hash += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return hash;
}

const firebaseApp =
	firebaseAdmin.apps.length > 0
		? firebaseAdmin.apps[0]
		: firebaseAdmin.initializeApp(
				{
					credential: firebaseAdmin.credential.cert(serviceAccount),
					databaseURL: process.env.V6_FIREBASE_URL,
				},
				'firebase-pub-new',
		  );
const database = firebaseApp.database();

Promise.all([])
	// .then(() => {
	// 	return v6_Pub.findAll({
	// 		where: { communityId: '51bee781-3cb4-4907-921c-41c5a5825b80' },
	// 		include: [{ model: v6_Branch, as: 'branches' }],
	// 	});
	// })
	// .then((pubData) => {
	// 	const events = pubData.map((pub) => {
	// 		console.log(pub.toJSON().id);
	// 		return database
	// 			.ref(`pub-${pub.id}`)
	// 			.once('value')
	// 			.then((snapshot) => {
	// 				const pubFirebaseData = snapshot.val();
	// 				const keys = Object.keys(pubFirebaseData);
	// 				const goodBranchIds = pub.branches.map((item) => item.id);
	// 				// console.log('good', goodBranchIds);
	// 				const keysToRemove = keys.filter((key) => {
	// 					return !goodBranchIds.includes(key.replace('branch-', ''));
	// 				});
	// 				return Promise.all(keysToRemove.map((badKey) => {
	// 					return database.ref(`pub-${pub.id}/${badKey}`).remove();
	// 				}));
	// 			});
	// 	});
	// 	return Promise.all(events);
	// })
	.then(() => {
		/*
			get all the channels that they made
			Create a new branch for each channel. Name the branch the name of the channel
			Add hannah and other to the branch
			Remove private branch
		*/
		return v5_DiscussionChannel.findAll({
			where: {
				communityId: '51bee781-3cb4-4907-921c-41c5a5825b80',
				isArchived: null,
			},
			include: [{ model: v5_DiscussionChannelParticipant, as: 'participants' }],
		});
	})
	.then((discussionChannels) => {
		const getBranches = discussionChannels.map((channel) => {
			return v6_Branch.findAll({
				where: {
					pubId: channel.pubId,
				},
			});
			// {
			// 	name: channel.title,
			// 	pubId: channel.pubId,
			// 	participants: channel.participants.map((item) => {
			// 		return { userId: item.userId, isModerator: item.isModerator };
			// 	}),
			// };
		});

		// Create branch
		// Create branch postgres
		// Create BranchParticipants

		// (baseFirebaseRef, newFirebaseRef)
		return Promise.all([discussionChannels, Promise.all(getBranches)]);
	})
	.then(([discussionChannels, branchesData]) => {
		const newBranchesData = discussionChannels.map((channel, index, array) => {
			const draftBranch = branchesData[index].find((branch) => branch.title === 'draft');
			const draftBranchId = draftBranch.id;
			const newBranchId = uuidv4();

			const newBranchData = {
				sourceId: draftBranchId,
				pubId: channel.pubId,
				id: newBranchId,
				title: channel.title,
				shortId: 37,
				order: Math.floor(index/array.length * 1000)/1000,
				communityAdminPermissions: 'manage',
				viewHash: generateHash(8),
				discussHash: generateHash(8),
				editHash: generateHash(8),
				firstKeyAt: draftBranch.firstKeyAt,
				latestKeyAt: draftBranch.latestKeyAt,
				participants: channel.participants.map((item) => item.userId),
			};
			return newBranchData;
		});
		// console.log(newBranchesData);
		// const newBranchPermissions = [];
		// newBranchesData.forEach((data) => {
		// 	data.participants.forEach((participant) => {
		// 		newBranchPermissions.push({
		// 			permissions: 'manage',
		// 			userId: participant,
		// 			pubId: data.pubId,
		// 			branchId: data.id,
		// 		});
		// 	});
		// });
		// return v6_Branch
		// 	.bulkCreate(newBranchesData)
		// 	.then(() => {
		// 		console.log('Created Branches');
		// 		return v6_BranchPermission.bulkCreate(newBranchPermissions);
		// 	})
		// 	.then(() => {
		// 		console.log('Created BranchPermissions');
		// 		return Promise.all(
		// 			newBranchesData.map((data) => {
		// 				return createBranch(
		// 					database.ref(`pub-${data.pubId}/branch-${data.sourceId}`),
		// 					database.ref(`pub-${data.pubId}/branch-${data.id}`),
		// 					9999999,
		// 				);
		// 			}),
		// 		);
		// 	});
	})
	.then(() => {
		console.log('Created FirebaseItems');
	})
	.catch((err) => {
		console.log('Error with Migration', err);
	})
	.finally(() => {
		console.log('Ending Migration');
		process.exit();
	});
