import type { ImportBody } from 'utils/api/schemas/import';

import { addWorkerTask } from 'server/utils/workers';

export const createImport = async ({ sourceFiles, importerFlags = {} }: ImportBody) => {
	return addWorkerTask({
		type: 'import',
		input: { sourceFiles, importerFlags },
	});
};
