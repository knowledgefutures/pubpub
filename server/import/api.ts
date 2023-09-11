import { contract } from 'utils/api/contract';
import { AppRouteImplementation } from '@ts-rest/express';
import { createImport } from './queries';

export const importRouteImplementation: AppRouteImplementation<typeof contract.import> = async ({
	body,
}) => {
	try {
		const taskData = await createImport(body);
		return { status: 201, body: taskData.id };
	} catch (err: any) {
		console.error('Error in postImport: ', err);
		return { status: 500, body: err.message };
	}
};
