import { addWorkerTask } from 'server/utils/workers';

export const createImport = async ({ sourceFiles, importerFlags }) => {
	return addWorkerTask({
		type: 'import',
		input: { sourceFiles, importerFlags },
	});
};
