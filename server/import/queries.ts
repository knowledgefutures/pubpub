import { addWorkerTask } from 'server/utils/workers';
import { ImportBody } from 'utils/api/schemas/import';

export const createImport = async ({ sourceFiles, importerFlags = {} }: ImportBody) => {
	return addWorkerTask({
		type: 'import',
		input: { sourceFiles, importerFlags },
	});
};
