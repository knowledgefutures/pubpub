import uuid from 'uuid/v4';

import { Draft } from 'server/models';

export const createDraft = (id: string = uuid()) => {
	return Draft.create({ id, firebasePath: `drafts/draft-${id}` });
};
