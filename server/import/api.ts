import type { AppRouteImplementation } from '@ts-rest/express';

import type { contract } from 'utils/api/contract';

import { createImport } from './queries';

export const importRouteImplementation: AppRouteImplementation<
	typeof contract.workerTask.createImport
> = async ({ body }) => {
	try {
		const taskData = await createImport(body);
		return { status: 201, body: taskData.id };
	} catch (err: any) {
		console.error('Error in postImport: ', err);
		return { status: 500, body: err.message };
	}
};
