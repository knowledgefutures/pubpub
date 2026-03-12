import type { ActivityFilter, ActivityItemKind, ScopeId } from 'types';

import { Router } from 'express';

import { ForbiddenError } from 'server/utils/errors';
import { getScope } from 'server/utils/queryHelpers';
import { wrap } from 'server/wrap';

import { fetchActivityItems } from './fetch';

export const router = Router();

const moderationKinds: ActivityItemKind[] = ['community-ban-created', 'community-ban-retracted'];

const unwrapRequest = (req) => {
	const { body, user } = req;
	const { scope, offset, filters, limit } = body;
	return {
		filters: filters as ActivityFilter[],
		scope: scope as ScopeId,
		userId: user?.id ?? null,
		offset: parseInt(offset, 10),
		limit: parseInt(limit, 10),
	};
};

export const activityItemRouter = Router().post(
	'/api/activityItems',
	wrap(async (req, res) => {
		const { scope, offset, limit, userId, filters } = unwrapRequest(req);
		const {
			activePermissions: { canView, canAdminCommunity },
		} = await getScope({ loginId: userId, ...scope });

		if (!canView) {
			throw new ForbiddenError();
		}

		const excludeKinds = canAdminCommunity ? undefined : moderationKinds;
		const result = await fetchActivityItems({ limit, offset, scope, filters, excludeKinds });
		res.status(200).json(result);
	}),
);
