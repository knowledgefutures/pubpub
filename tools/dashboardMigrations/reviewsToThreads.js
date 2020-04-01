/* eslint-disable no-console */
import uuidv4 from 'uuid/v4';
import {
	Pub,
	Review,
	ReviewEvent,
	ReviewNew,
	Thread,
	ThreadComment,
	ThreadEvent,
	Visibility,
	User,
} from '../../server/models';

export default async () => {
	/* Migrate Reviews to Threads */
	const reviewData = await Review.findAll({
		include: [{ model: ReviewEvent, as: 'reviewEvents' }],
	});

	const pubsData = await Pub.findAll({
		attributes: ['id'],
	});
	const usersData = await User.findAll({ attributes: ['id'] });
	const userSet = new Set();
	usersData.forEach((user) => userSet.add(user.id));
	const pubIds = pubsData.map((pub) => pub.id);

	const reviews = [];
	const threads = [];
	const visibilities = [];
	let events = [];
	let comments = [];
	Object.values(reviewData)
		.filter((review) => {
			return pubIds.includes(review.pubId);
		})
		.filter((review) => {
			const creatorId = review.reviewEvents.reduce((prev, curr) => {
				if (curr.data.statusChange === 'created') {
					return curr.userId;
				}
				return prev;
			}, undefined);
			return userSet.has(creatorId);
		})
		.forEach((review) => {
			const creatorId = review.reviewEvents.reduce((prev, curr) => {
				if (curr.data.statusChange === 'created') {
					return curr.userId;
				}
				return prev;
			}, undefined);
			if (!creatorId) {
				console.log('Woah undefined?!');
			}

			const threadId = uuidv4();
			const visibilityId = uuidv4();
			let status = 'open';
			if (review.isClosed) {
				status = 'closed';
			}
			if (review.isCompleted) {
				status = 'completed';
			}
			const newReview = {
				id: review.id,
				title: `Review #${review.shortId}`,
				number: review.shortId,
				status: status,
				// branchId: review.sourceBranchId,
				threadId: threadId,
				visibilityId: visibilityId,
				userId: creatorId,
				pubId: review.pubId,
				createdAt: review.createdAt,
				updatedAt: review.updatedAt,
			};
			const newVisibility = {
				id: visibilityId,
				access: 'members',
			};
			const newThread = {
				id: threadId,
			};
			// const newThread = {
			// 	id: newThreadId,
			// 	title: `Review #${review.shortId}`,
			// 	number: review.shortId,
			// 	isClosed: review.isClosed,
			// 	userId: creatorId,
			// 	reviewId: review.id,
			// 	pubId: review.pubId,
			// };
			const newComments = review.reviewEvents
				.filter((event) => {
					return userSet.has(event.userId);
				})
				.filter((event) => {
					return event.type === 'comment';
				})
				.map((item) => {
					return {
						text: item.data.text,
						content: item.data.content,
						userId: item.userId,
						threadId: threadId,
						createdAt: item.createdAt,
						updatedAt: item.updatedAt,
					};
				});
			const newEvents = review.reviewEvents
				.filter((event) => {
					return userSet.has(event.userId);
				})
				.filter((event) => {
					return event.type !== 'comment';
				})
				.map((item) => {
					return {
						type: item.type,
						data: item.data,
						userId: item.userId,
						threadId: threadId,
						createdAt: item.createdAt,
						updatedAt: item.updatedAt,
					};
				});
			reviews.push(newReview);
			threads.push(newThread);
			visibilities.push(newVisibility);
			comments = [...comments, ...newComments];
			events = [...events, ...newEvents];
		});
	// console.log(reviews);
	// console.log(threads);
	// console.log(visibilities);
	// console.log(comments);
	// console.log(events);
	await Thread.bulkCreate(threads);
	console.log('Created Threads');
	await ThreadComment.bulkCreate(comments);
	console.log('Created ThreadComments');
	await ThreadEvent.bulkCreate(events);
	console.log('Created ThreadEvents');
	await Visibility.bulkCreate(visibilities);
	console.log('Created Visibilities');
	await ReviewNew.bulkCreate(reviews);
	console.log('Created Reviews');
};
