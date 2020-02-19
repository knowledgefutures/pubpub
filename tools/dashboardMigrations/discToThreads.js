/* eslint-disable no-console */
import { Discussion, Thread, ThreadComment } from '../../server/models';

export default async () => {
	/* Migrate Discussions to Threads */
	const discusssionsData = await Discussion.findAll();
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
	Object.values(groupedDiscussions).forEach((group) => {
		const header = group[0];
		const newThread = {
			id: header.id,
			title: header.title,
			number: header.threadNumber,
			isClosed: header.isArchived,
			labels: header.labels,
			// visibility: TODO: calculate based on branch
			initBranchId: header.branchId,
			// initBranchKey TODO: find in firebase?
			// highlightAnchor
			// highlightHead
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
		threads.push(newThread);
		comments = [...comments, ...newComments];
	});
	await Thread.bulkCreate(threads);
	console.log('Create Threads');
	await ThreadComment.bulkCreate(comments);
	console.log('Create ThreadComments');
};
