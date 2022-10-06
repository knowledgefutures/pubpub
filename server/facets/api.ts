import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';
import { getScopeId } from 'facets';

import { updateFacetsForScope } from './update';
import { canUserUpdateFacetsForScope } from './permissions';

app.post(
	'/api/facets',
	wrap(async (req, res) => {
		const { facets, scope } = req.body;
		const scopeId = getScopeId(scope);
		const canUpdate = await canUserUpdateFacetsForScope(scopeId, req.user?.id);
		if (!canUpdate) {
			throw new ForbiddenError();
		}
		await updateFacetsForScope(scopeId, facets);
		return res.status(200).json({});
	}),
);
