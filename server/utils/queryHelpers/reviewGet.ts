import { Pub, Reviewer, ReviewNew } from 'server/models';

import { authorIncludes, baseVisibility, threadIncludes } from './util';

export default async (pubSlug: string, reviewNumber: number, communityId: string) => {
	const sanitizedSlug = pubSlug.toLowerCase();
	const pubData = await Pub.findOne({
		where: { slug: sanitizedSlug, communityId },
	});
	if (!pubData) {
		throw new Error('Review Not Found');
	}

	const reviewData = await ReviewNew.findOne({
		where: {
			number: reviewNumber,
			pubId: pubData.id,
		},
		include: [
			...authorIncludes(communityId),
			...baseVisibility,
			...threadIncludes(communityId),
			{ model: Reviewer, as: 'reviewers' },
		],
	});

	if (!reviewData) {
		throw new Error('Review Not Found');
	}
	return reviewData.toJSON();
};
