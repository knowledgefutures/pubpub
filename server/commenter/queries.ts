import { Commenter } from 'server/models';
import * as types from 'types';

export const createCommenter = (props: Pick<types.Commenter, 'name'>) => {
	const { name } = props;
	return Commenter.create({
		name,
	});
};
