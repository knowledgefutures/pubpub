import { initServer } from '@ts-rest/express';

import { getScopeId } from 'facets';
import { BadRequestError, ForbiddenError } from 'server/utils/errors';
import { contract } from 'utils/api/contract';

import { canUserUpdateFacetsForScope } from './permissions';
import { updateFacetsForScope } from './update';

const s = initServer();

export const facetsServer = s.router(contract.facets, {
	update: async ({ req, body }) => {
		const { facets, scope } = body;
		const scopeId = getScopeId(scope);
		const canUpdate = await canUserUpdateFacetsForScope(scopeId, req.user?.id);
		if (!canUpdate) {
			throw new ForbiddenError();
		}
		try {
			await updateFacetsForScope(scopeId, facets, req.user?.id);
		} catch (_err) {
			throw new BadRequestError();
		}
		return { status: 200, body: {} };
	},
});
