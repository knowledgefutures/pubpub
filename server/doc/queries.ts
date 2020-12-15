import { Doc } from 'server/models';

export const createDoc = (content: {}) => {
	return Doc.create({ content: content });
};
