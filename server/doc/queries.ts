import { Doc } from 'server/models';
import { DocJson } from 'types';

export const createDoc = (content: DocJson, sequelizeTransaction: any = null) => {
	return Doc.create({ content }, { transaction: sequelizeTransaction });
};
