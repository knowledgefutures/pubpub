import { ForbiddenError } from 'server/utils/errors';

import { createGetRequestIds } from 'utils/getRequestIds';
import { initServer } from '@ts-rest/express';
import { contract } from 'utils/api/contract';
import { DocJson } from 'types';
import { createRelease, ReleaseQueryError } from './queries';
import { getPermissions } from './permissions';

const getRequestValues = createGetRequestIds<{
	communityId?: string;
	historyKey?: number;
	noteContent?: DocJson | null;
	noteText?: string | null;
	pubId?: string;
}>();

const s = initServer();

export const releaseServer = s.router(contract.release, {
	create: async ({ req, body }) => {
		const { communityId, historyKey, noteContent, noteText, pubId, userId } = getRequestValues(
			body,
			req.user,
		);
		const permissions = await getPermissions({
			userId,
			pubId,
			communityId,
		});

		if (!permissions.create || !userId) {
			throw new ForbiddenError();
		}

		try {
			const release = await createRelease({
				userId,
				pubId,
				historyKey,
				noteText,
				noteContent,
			});

			return { status: 201, body: release };
		} catch (error) {
			if (error instanceof ReleaseQueryError) {
				return { status: 400, body: error.message };
			}
			throw error;
		}
	},
});
