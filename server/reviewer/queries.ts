import { Reviewer } from 'server/models';
import { Reviewer as ReviewerFields } from 'types';

export const createReviewer = ({ id, name }: ReviewerFields) => {
	return Reviewer.create(
		{
			reviewId: id,
			name,
		},
		{ returning: true },
	);
};
