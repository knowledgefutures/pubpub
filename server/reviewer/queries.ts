import { Reviewer } from 'server/models';
import { Reviewer as ReviewerFields } from 'types';

export const createReviewer = ({ id, name }: Pick<ReviewerFields, 'id' | 'name'>) => {
	return Reviewer.create(
		{
			reviewId: id,
			name,
		},
		{ returning: true },
	);
};
