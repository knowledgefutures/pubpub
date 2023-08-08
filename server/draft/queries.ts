import uuid from 'uuid/v4';

import { Draft } from 'server/models';
import { expect } from 'utils/assert';

export const createDraft = (id: string = uuid()) => {
	return Draft.create({ id, firebasePath: `drafts/draft-${id}` });
};

export const getDraftFirebasePath = async (id: string) => {
	const draft = expect(await Draft.findOne({ where: { id } }));
	return draft.firebasePath;
};
