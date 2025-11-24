import type { Reviewer as ReviewerFields } from 'types';

import { Reviewer } from 'server/models';

export const createReviewer = ({ id, name }: Pick<ReviewerFields, 'id' | 'name'>) => {
	return Reviewer.create(
		{
			reviewId: id,
			name,
		},
		{ returning: true },
	);
};
