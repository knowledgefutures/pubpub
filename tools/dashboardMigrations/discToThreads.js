/* eslint-disable no-console */
import { Branch, Discussion, Thread, ThreadAnchor, ThreadComment } from '../../server/models';

const firebaseAdmin = require('firebase-admin');
require('../../server/config.js');

const serviceAccount = JSON.parse(
	Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
);
const firebaseApp =
	firebaseAdmin.apps.length > 0
		? firebaseAdmin.apps[0]
		: firebaseAdmin.initializeApp(
				{
					credential: firebaseAdmin.credential.cert(serviceAccount),
					databaseURL: 'https://pubpub-v6-dev.firebaseio.com',
				},
				'firebase-pub-new',
		  );
const database = firebaseApp.database();

/* Takes 25 minutes to run */
export default async () => {
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

	const threads = [];
	let comments = [];
	const anchors = [];
	const groupedDiscussionValues = Object.values(groupedDiscussions);
	for (let i = 0; i < groupedDiscussionValues.length; i++) {
		const group = groupedDiscussionValues[i];
		const header = group[0];
		const newThread = {
			id: header.id,
			title: header.title,
			number: header.threadNumber,
			isClosed: header.isArchived,
			labels: header.labels,
			visibility: visibilityByBranchId[header.branchId],
			userId: header.userId,
			pubId: header.pubId,
		};
		const newComments = group.map((item) => {
			return {
				text: item.text,
				content: item.content,
				userId: item.userId,
				threadId: header.id,
			};
		});

		const dbHighlight = header.highlights ? header.highlights[0] : {};
		const discussionRef = database.ref(
			`pub-${header.pubId}/branch-${header.branchId}/discussions/${header.id}`,
		);

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
		const newAnchor = {
			prefix: dbHighlight.prefix,
			exact: dbHighlight.exact,
			suffix: dbHighlight.suffix,
			from: firebaseFrom,
			to: firebaseTo,
			branchKey: firebaseHighlight.initAnchor && firebaseHighlight.initKey,
			branchId: header.branchId,
			threadId: header.id,
		};
		threads.push(newThread);
		comments = [...comments, ...newComments];
		anchors.push(newAnchor);
	}
	await Thread.bulkCreate(threads);
	console.log('Create Threads');
	await ThreadComment.bulkCreate(comments);
	console.log('Create ThreadComments');
	await ThreadAnchor.bulkCreate(anchors);
	console.log('Create ThreadAnchors');
};
