import app, { wrap } from 'server/server';
import { BadRequestError, ForbiddenError } from 'server/utils/errors';
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
		try {
			await updateFacetsForScope(scopeId, facets, req.user?.id);
		} catch (err) {
			throw new BadRequestError();
		}
		return res.status(200).json({});
	}),
);
