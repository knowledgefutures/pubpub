import { Commenter } from 'server/models';
import * as types from 'types';

export const createCommenter = (props: Pick<types.Commenter, 'name'>): Promise<types.Commenter> => {
	const { name } = props;
	return Commenter.create({
		name,
	});
};
