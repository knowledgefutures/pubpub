import { Doc } from 'server/models';

export const createDoc = (content: {}, sequelizeTransaction: any = null) => {
	return Doc.create({ content: content }, { transaction: sequelizeTransaction });
};
