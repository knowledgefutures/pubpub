/* eslint-disable no-console */
import uuidv4 from 'uuid/v4';

import {
	Anchor,
	Branch,
	Discussion,
	DiscussionNew,
	Thread,
	ThreadComment,
	Visibility,
} from 'server/models';
import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const firebaseAdmin = require('firebase-admin');

const serviceAccount = JSON.parse(
	Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
);

/* Takes 25 minutes to run */
export default async () => {
	console.log(`DiscToThread using ${getFirebaseConfig().databaseURL}`);
	const firebaseApp =
		firebaseAdmin.apps.length > 0
			? firebaseAdmin.apps[0]
			: firebaseAdmin.initializeApp(
					{
						credential: firebaseAdmin.credential.cert(serviceAccount),
						databaseURL: getFirebaseConfig().databaseURL,
					},
					'firebase-pub-new',
			  );
	const database = firebaseApp.database();

	/* Migrate Discussions to Threads */
	const discusssionsData = await Discussion.findAll({});
	const branchData = await Branch.findAll({});
	const visibilityByBranchId = {};
	branchData.forEach((branch) => {
		visibilityByBranchId[branch.id] = branch.title === 'public' ? 'public' : 'members';
	});
	const groupedDiscussions = {};
	discusssionsData.forEach((discussion) => {
		const key = `${discussion.pubId}-${discussion.threadNumber}`;
		const nextGroup = groupedDiscussions[key] || [];
		nextGroup.push(discussion);
		nextGroup.sort((foo, bar) => {
			if (foo.createdAt < bar.createdAt) {
				return -1;
			}
			if (foo.createdAt > bar.createdAt) {
				return 1;
			}
			return 0;
		});
		groupedDiscussions[key] = nextGroup;
	});

	const discussions = [];
	const threads = [];
	const visibilities = [];
	let comments = [];
	const anchors = [];
	const groupedDiscussionValues = Object.values(groupedDiscussions);
	for (let i = 0; i < groupedDiscussionValues.length; i++) {
		const group = groupedDiscussionValues[i];
		const header = group[0];
		const threadId = uuidv4();
		const visibilityId = uuidv4();
		const anchorId = uuidv4();
		const newDiscussion = {
			id: header.id,
			title: header.title,
			number: header.threadNumber,
			isClosed: header.isArchived,
			labels: header.labels,
			userId: header.userId,
			pubId: header.pubId,
			threadId: threadId,
			visibilityId: visibilityId,
			createdAt: header.createdAt,
			updatedAt: header.updatedAt,
		};
		const newVisibility = {
			id: visibilityId,
			access: visibilityByBranchId[header.branchId],
		};
		const newThread = {
			id: threadId,
		};
		const newComments = group.map((item) => {
			return {
				text: item.text,
				content: item.content,
				userId: item.userId,
				threadId: threadId,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			};
		});

		// const newThread = {
		// 	id: header.id,
		// 	title: header.title,
		// 	number: header.threadNumber,
		// 	isClosed: header.isArchived,
		// 	labels: header.labels,
		// 	visibility: visibilityByBranchId[header.branchId],
		// 	userId: header.userId,
		// 	pubId: header.pubId,
		// };
		// const newComments = group.map((item) => {
		// 	return {
		// 		text: item.text,
		// 		content: item.content,
		// 		userId: item.userId,
		// 		threadId: header.id,
		// 	};
		// });
		const dbHighlight = header.highlights ? header.highlights[0] : {};
		const discussionRef = database.ref(
			`pub-${header.pubId}/branch-${header.branchId}/discussions/${header.id}`,
		);

		/* eslint-disable-next-line no-await-in-loop */
		const firebaseHighlightSnapshot = await discussionRef.once('value');
		const firebaseHighlight = firebaseHighlightSnapshot.val() || {};
		const firebaseFrom =
			firebaseHighlight.initAnchor &&
			Math.min(firebaseHighlight.initAnchor, firebaseHighlight.initHead);
		const firebaseTo =
			firebaseHighlight.initAnchor &&
			Math.max(firebaseHighlight.initAnchor, firebaseHighlight.initHead);
		// if (
		// 	firebaseHighlight.initAnchor &&
		// 	dbHighlight.from &&
		// 	(dbHighlight.from !== firebaseFrom || dbHighlight.to !== firebaseTo)
		// ) {
		// 	console.log(
		// 		'Doesnt Match!',
		// 		header.id,
		// 		header.pubId,
		// 		header.branchId,
		// 		dbHighlight,
		// 		firebaseHighlight,
		// 	);
		// }
		// if (dbHighlight.from && !firebaseHighlight.initAnchor) {
		// 	console.log(
		// 		'Missing fbHigh',
		// 		header.id,
		// 		header.pubId,
		// 		header.branchId,
		// 		dbHighlight,
		// 		firebaseHighlight,
		// 	);
		// }
		// const newAnchor = {
		// 	prefix: dbHighlight.prefix,
		// 	exact: dbHighlight.exact,
		// 	suffix: dbHighlight.suffix,
		// 	from: firebaseFrom,
		// 	to: firebaseTo,
		// 	branchKey: firebaseHighlight.initAnchor && firebaseHighlight.initKey,
		// 	branchId: header.branchId,
		// 	threadId: header.id,
		// };
		const newAnchor = {
			id: anchorId,
			prefix: dbHighlight.prefix,
			exact: dbHighlight.exact,
			suffix: dbHighlight.suffix,
			from: firebaseFrom,
			to: firebaseTo,
			branchKey: firebaseHighlight.initAnchor && firebaseHighlight.initKey,
			branchId: header.branchId,
		};
		discussions.push(newDiscussion);
		threads.push(newThread);
		visibilities.push(newVisibility);
		comments = [...comments, ...newComments];
		anchors.push(newAnchor);

		// threads.push(newThread);
		// comments = [...comments, ...newComments];
		// anchors.push(newAnchor);
	}
	await Anchor.bulkCreate(anchors);
	console.log('Created Anchors');
	await Thread.bulkCreate(threads);
	console.log('Created Threads');
	await ThreadComment.bulkCreate(comments);
	console.log('Created ThreadComments');
	await Visibility.bulkCreate(visibilities);
	console.log('Created Visibilities');
	await DiscussionNew.bulkCreate(discussions);
	console.log('Created Discussions');
};
