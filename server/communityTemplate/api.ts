import { Router } from 'express';

import { isUserHubManager } from 'server/hub/queries';
import { ForbiddenError, HTTPStatusError, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';

import {
	createTemplate,
	createTemplateFromCommunity,
	destroyTemplate,
	fetchCollectionByUrl,
	fetchPageByUrl,
	fetchPubContent,
	findCommunityByUrl,
	getActiveTemplatesForHub,
	getAllTemplates,
	getTemplateById,
	getTemplatesForHub,
	updateTemplate,
} from './queries';

export const router = Router();

// ─── Auth helpers ────────────────────────────────────────────────

const requireSuperAdmin = async (req: any) => {
	const initialData = await getInitialData(req);
	if (!initialData.loginData.isSuperAdmin) {
		throw new ForbiddenError();
	}
	return initialData;
};

const requireSuperAdminOrHubManager = async (req: any, hubId: string) => {
	const initialData = await getInitialData(req);
	if (initialData.loginData.isSuperAdmin) {
		return initialData;
	}
	if (initialData.loginData.id) {
		const isMgr = await isUserHubManager(initialData.loginData.id, hubId);
		if (isMgr) {
			return initialData;
		}
	}
	throw new ForbiddenError();
};

/**
 * For template-level operations: allows superadmin, or hub manager if the template
 * belongs to a hub they manage.
 */
const requireSuperAdminOrTemplateOwner = async (req: any, templateId: string) => {
	const initialData = await getInitialData(req);
	if (initialData.loginData.isSuperAdmin) {
		return initialData;
	}
	const template = await getTemplateById(templateId);
	if (!template) {
		throw new NotFoundError();
	}
	if (template.hubId && initialData.loginData.id) {
		const isMgr = await isUserHubManager(initialData.loginData.id, template.hubId);
		if (isMgr) {
			return initialData;
		}
	}
	throw new ForbiddenError();
};

// Fields allowed on template create/update via API
const templateBodyFields = [
	'slug',
	'title',
	'description',
	'avatar',
	'isActive',
	'communityOverrides',
	'pages',
	'collections',
	'navigation',
	'footerLinks',
	'defaultMembers',
	'facetOverrides',
	'starterPubs',
	'customCSS',
] as const;

const pickTemplateFields = (body: Record<string, any>) => {
	const result: Record<string, any> = {};
	for (const key of templateBodyFields) {
		if (key in body) {
			result[key] = body[key];
		}
	}
	return result as Partial<Parameters<typeof createTemplate>[0]>;
};

/** Resolve a communityId from req.body, accepting either communityId or communityUrl */
const resolveCommunityId = async (body: Record<string, any>) => {
	let resolvedCommunityId = body.communityId;
	if (!resolvedCommunityId && body.communityUrl) {
		const community = await findCommunityByUrl(body.communityUrl);
		resolvedCommunityId = community.id;
	}
	return resolvedCommunityId;
};

// ─── Template CRUD (superadmin only) ─────────────────────────────

// GET /api/communityTemplates — list all templates
router.get('/api/communityTemplates', async (req, res, next) => {
	try {
		await requireSuperAdmin(req);
		const templates = await getAllTemplates();
		return res.status(200).json(templates);
	} catch (err) {
		return next(err);
	}
});

// POST /api/communityTemplates — create a template
router.post('/api/communityTemplates', async (req, res, next) => {
	try {
		const initialData = await requireSuperAdmin(req);
		const template = await createTemplate({
			...pickTemplateFields(req.body),
			createdById: initialData.loginData.id,
		} as Parameters<typeof createTemplate>[0]);
		return res.status(201).json(template.toJSON());
	} catch (err) {
		return next(err);
	}
});

// POST /api/communityTemplates/from-community — create a template from an existing community
router.post('/api/communityTemplates/from-community', async (req, res, next) => {
	try {
		const initialData = await requireSuperAdmin(req);
		const { title, slug, description, includePages, includeCollections } = req.body;

		const resolvedCommunityId = await resolveCommunityId(req.body);
		if (!resolvedCommunityId || !title || !slug) {
			return res
				.status(400)
				.json({ error: 'communityUrl (or communityId), title, and slug are required' });
		}
		const { template, warnings } = await createTemplateFromCommunity(resolvedCommunityId, {
			title,
			slug,
			description,
			createdById: initialData.loginData.id,
			includePages,
			includeCollections,
		});
		return res.status(201).json({ ...template.toJSON(), _warnings: warnings });
	} catch (err) {
		return next(err);
	}
});

// GET /api/communityTemplates/:id — get a template
router.get('/api/communityTemplates/:id', async (req, res, next) => {
	try {
		await requireSuperAdminOrTemplateOwner(req, req.params.id);
		const template = await getTemplateById(req.params.id);
		if (!template) {
			throw new NotFoundError();
		}
		return res.status(200).json(template);
	} catch (err) {
		return next(err);
	}
});

// PUT /api/communityTemplates/:id — update a template
router.put('/api/communityTemplates/:id', async (req, res, next) => {
	try {
		await requireSuperAdminOrTemplateOwner(req, req.params.id);
		const template = await updateTemplate(req.params.id, pickTemplateFields(req.body));
		return res.status(200).json(template.toJSON());
	} catch (err) {
		return next(err);
	}
});

// DELETE /api/communityTemplates/:id — delete a template
router.delete('/api/communityTemplates/:id', async (req, res, next) => {
	try {
		await requireSuperAdminOrTemplateOwner(req, req.params.id);
		await destroyTemplate(req.params.id);
		return res.status(200).json({ success: true });
	} catch (err) {
		return next(err);
	}
});

// ─── Hub ↔ Template routes (superadmin or hub manager) ───────────

// GET /api/hubs/:hubId/templates — list templates belonging to this hub
router.get('/api/hubs/:hubId/templates', async (req, res, next) => {
	try {
		await requireSuperAdminOrHubManager(req, req.params.hubId);
		const templates = await getTemplatesForHub(req.params.hubId);
		return res.status(200).json(templates.map((t) => t.toJSON()));
	} catch (err) {
		return next(err);
	}
});

// POST /api/hubs/:hubId/templates — create a new template owned by this hub
router.post('/api/hubs/:hubId/templates', async (req, res, next) => {
	try {
		const initialData = await requireSuperAdminOrHubManager(req, req.params.hubId);
		const template = await createTemplate({
			...pickTemplateFields(req.body),
			hubId: req.params.hubId,
			createdById: initialData.loginData.id,
		} as Parameters<typeof createTemplate>[0]);
		return res.status(201).json(template.toJSON());
	} catch (err) {
		return next(err);
	}
});

// POST /api/hubs/:hubId/templates/from-community — clone template from community, owned by hub
router.post('/api/hubs/:hubId/templates/from-community', async (req, res, next) => {
	try {
		const initialData = await requireSuperAdminOrHubManager(req, req.params.hubId);
		const { title, slug, description, includePages, includeCollections } = req.body;

		const resolvedCommunityId = await resolveCommunityId(req.body);
		if (!resolvedCommunityId || !title || !slug) {
			return res
				.status(400)
				.json({ error: 'communityUrl (or communityId), title, and slug are required' });
		}
		const { template, warnings } = await createTemplateFromCommunity(resolvedCommunityId, {
			title,
			slug,
			description,
			createdById: initialData.loginData.id,
			includePages,
			includeCollections,
		});
		await template.update({ hubId: req.params.hubId });
		return res.status(201).json({ ...template.toJSON(), _warnings: warnings });
	} catch (err) {
		return next(err);
	}
});

// ─── Public: get active templates for hub (used by community create page) ────

// GET /api/hubs/:hubId/activeTemplates — public-ish (for community create flow)
router.get('/api/hubs/:hubId/activeTemplates', async (req, res, next) => {
	try {
		const templates = await getActiveTemplatesForHub(req.params.hubId);
		return res.status(200).json(templates);
	} catch (err) {
		return next(err);
	}
});

// POST /api/communityTemplates/fetch-pub-content — fetch a pub's latest release content by URL
router.post('/api/communityTemplates/fetch-pub-content', async (req, res, next) => {
	try {
		const { pubUrl, templateId } = req.body;
		// Allow superadmin, or hub manager if they provide a templateId they own
		if (templateId) {
			await requireSuperAdminOrTemplateOwner(req, templateId);
		} else {
			await requireSuperAdmin(req);
		}
		if (!pubUrl) {
			return res.status(400).json({ error: 'pubUrl is required' });
		}
		const result = await fetchPubContent(pubUrl);
		return res.status(200).json(result);
	} catch (err) {
		if (err instanceof HTTPStatusError) return next(err);
		const message = err instanceof Error ? err.message : 'Failed to fetch pub';
		return res.status(400).json({ error: message });
	}
});

// POST /api/communityTemplates/fetch-page — fetch page data by URL
router.post('/api/communityTemplates/fetch-page', async (req, res, next) => {
	try {
		const { pageUrl, templateId } = req.body;
		if (templateId) {
			await requireSuperAdminOrTemplateOwner(req, templateId);
		} else {
			await requireSuperAdmin(req);
		}
		if (!pageUrl) {
			return res.status(400).json({ error: 'pageUrl is required' });
		}
		const result = await fetchPageByUrl(pageUrl);
		return res.status(200).json(result);
	} catch (err) {
		if (err instanceof HTTPStatusError) return next(err);
		const message = err instanceof Error ? err.message : 'Failed to fetch page';
		return res.status(400).json({ error: message });
	}
});

// POST /api/communityTemplates/fetch-collection — fetch collection data by URL
router.post('/api/communityTemplates/fetch-collection', async (req, res, next) => {
	try {
		const { collectionUrl, templateId } = req.body;
		if (templateId) {
			await requireSuperAdminOrTemplateOwner(req, templateId);
		} else {
			await requireSuperAdmin(req);
		}
		if (!collectionUrl) {
			return res.status(400).json({ error: 'collectionUrl is required' });
		}
		const result = await fetchCollectionByUrl(collectionUrl);
		return res.status(200).json(result);
	} catch (err) {
		if (err instanceof HTTPStatusError) return next(err);
		const message = err instanceof Error ? err.message : 'Failed to fetch collection';
		return res.status(400).json({ error: message });
	}
});
