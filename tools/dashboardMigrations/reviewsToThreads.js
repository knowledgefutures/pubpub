/* eslint-disable no-console */
import uuidv4 from 'uuid/v4';
import { Thread, ThreadComment, Pub, Review, ReviewEvent } from '../../server/models';

export default async () => {
	/* Migrate Reviews to Threads */
	const reviewData = await Review.findAll({
		include: [{ model: ReviewEvent, as: 'reviewEvents' }],
	});

	const pubsData = await Pub.findAll({
		attributes: ['id'],
	});
	const pubIds = pubsData.map((pub) => pub.id);
	const threads = [];
	let comments = [];
	Object.values(reviewData)
		.filter((review) => {
			return pubIds.includes(review.pubId);
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

			const newThreadId = uuidv4();
			const newThread = {
				id: newThreadId,
				title: `Review #${review.shortId}`,
				number: review.shortId,
				isClosed: review.isClosed,
				userId: creatorId,
				reviewId: review.id,
				pubId: review.pubId,
			};
			const newComments = review.reviewEvents
				.filter((event) => {
					return event.type === 'comment';
				})
				.map((item) => {
					return {
						text: item.data.text,
						content: item.data.content,
						userId: item.userId,
						threadId: newThreadId,
					};
				});
			threads.push(newThread);
			comments = [...comments, ...newComments];
		});
	await Thread.bulkCreate(threads);
	console.log('Create Review Threads');
	await ThreadComment.bulkCreate(comments);
	console.log('Create Review ThreadComments');
};
