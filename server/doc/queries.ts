import type { DocJson } from 'types';

import { Doc } from 'server/models';

export const createDoc = (content: DocJson, sequelizeTransaction: any = null) => {
	return Doc.create({ content }, { transaction: sequelizeTransaction });
};
