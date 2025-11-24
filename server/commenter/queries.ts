import type * as types from 'types';

import { Commenter } from 'server/models';

export const createCommenter = (props: Pick<types.Commenter, 'name'>) => {
	const { name } = props;
	return Commenter.create({
		name,
	});
};
