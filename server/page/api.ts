import { initServer } from '@ts-rest/express';

import { ForbiddenError } from 'server/utils/errors';
import { contract } from 'utils/api/contract';
import { createGetRequestIds } from 'utils/getRequestIds';
import { queryMany } from 'utils/query/queryMany';
import { queryOne } from 'utils/query/queryOne';

import { Page } from './model';
import { getPermissions } from './permissions';
import { createPage, destroyPage, updatePage } from './queries';

const getRequestIds = createGetRequestIds<{
	communityId?: string;
	pubId?: string;
	pageId?: string;
}>();

const s = initServer();

export const pageServer = s.router(contract.page, {
	get: queryOne(Page, { allowSlug: true }),
	getMany: queryMany(Page),
	create: async ({ req, body }) => {
		const { userId, communityId, pageId } = getRequestIds(body, req.user);
		const permissions = await getPermissions({
			userId,
			communityId,
			pageId,
		});
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newPage = await createPage(body, req.user.id);
		return { status: 201, body: newPage };
	},

	update: async ({ req, body }) => {
		const ids = getRequestIds(body, req.user);
		const permissions = await getPermissions(ids);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updatePage(body, permissions.update, req.user.id);
		return { status: 201, body: updatedValues };
	},

	remove: async ({ req, body }) => {
		const ids = getRequestIds(body, req.user);
		const permissions = await getPermissions(ids);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		try {
			await destroyPage(body, req.user.id);
			return { status: 201, body: body.pageId };
		} catch (e) {
			console.error(e);
			throw new Error(e as string);
		}
	},
});
