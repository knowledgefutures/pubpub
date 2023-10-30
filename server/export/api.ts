import { ForbiddenError } from 'server/utils/errors';

import { createGetRequestIds } from 'utils/getRequestIds';
import { AppRouteImplementation } from '@ts-rest/express';
import { contract } from 'utils/api/contract';
import { getPermissions } from './permissions';
import { getOrStartExportTask } from './queries';

const getRequestData = createGetRequestIds<{
	accessHash?: string | null;
	format?: string;
	historyKey?: number;
	pubId?: string;
	communityId?: string;
}>();

export const exportRouteImplementation: AppRouteImplementation<typeof contract.export> = async ({
	req,
	body,
}) => {
	const { accessHash, format, historyKey, pubId, userId, communityId } = getRequestData(
		body,
		req.user,
	);
	const permissions = await getPermissions({
		accessHash,
		userId,
		pubId,
		communityId,
		historyKey,
	});

	if (!permissions.create) {
		throw new ForbiddenError();
	}

	const result = await getOrStartExportTask({
		format,
		historyKey,
		pubId,
	});

	return { status: 201, body: result };
};
