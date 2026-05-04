import type {
	TemplateCollectionDefinition,
	TemplateCommunityOverrides,
	TemplateDefaultMember,
	TemplateFacetOverrides,
	TemplateNavigationEntry,
	TemplatePageDefinition,
	TemplateStarterPubDefinition,
} from 'types';

import { Op } from 'sequelize';

import { ALL_FACET_DEFINITIONS } from 'facets';
import {
	Collection,
	Community,
	CustomScript,
	Doc,
	FacetBinding,
	facetModels,
	Page,
	Pub,
	Release,
	User,
} from 'server/models';
import { sequelize } from 'server/sequelize';
import { slugifyString } from 'utils/strings';

import { Hub } from '../hub/model';
import { CommunityTemplate } from './model';

// ─── CRUD ────────────────────────────────────────────────────────

/**
 * Fetch source community data for templates that have a sourceCommunityId.
 * Because CommunityTemplate → Community would create a circular FK (Community
 * already references CommunityTemplate via templateId), we avoid using a
 * Sequelize association and instead query manually.
 */
async function attachSourceCommunities<T extends Record<string, any>>(items: T[]): Promise<T[]> {
	const ids = items.map((t) => t.sourceCommunityId).filter(Boolean);
	if (ids.length === 0) return items;
	const communities = await Community.findAll({
		where: { id: { [Op.in]: ids } },
		attributes: ['id', 'subdomain', 'title', 'domain'],
		raw: true,
	});
	const map = new Map(communities.map((c) => [c.id, c]));
	return items.map((t) => ({
		...t,
		sourceCommunity: t.sourceCommunityId ? (map.get(t.sourceCommunityId) ?? null) : null,
	}));
}

export const createTemplate = async (values: {
	slug: string;
	title: string;
	description?: string | null;
	avatar?: string | null;
	isActive?: boolean;
	communityOverrides?: TemplateCommunityOverrides;
	pages?: TemplatePageDefinition[];
	collections?: TemplateCollectionDefinition[];
	navigation?: TemplateNavigationEntry[] | null;
	footerLinks?: any[] | null;
	defaultMembers?: TemplateDefaultMember[];
	facetOverrides?: TemplateFacetOverrides;
	starterPubs?: TemplateStarterPubDefinition[];
	customCSS?: string | null;
	sourceCommunityId?: string | null;
	createdById?: string | null;
	hubId?: string | null;
}) => {
	const slug = slugifyString(values.slug);
	const existing = await CommunityTemplate.findOne({ where: { slug } });
	if (existing) {
		throw new Error(`Template slug "${slug}" is already in use`);
	}
	return CommunityTemplate.create({ ...values, slug });
};

export const getTemplateById = async (id: string) => {
	const template = await CommunityTemplate.findByPk(id, {
		include: [
			{ model: User, as: 'createdBy', attributes: ['id', 'fullName', 'avatar'] },
			{ model: Hub, as: 'hub', attributes: ['id', 'slug', 'title'] },
		],
	});
	if (!template) return null;
	const [enriched] = await attachSourceCommunities([template.toJSON()]);
	return enriched;
};

export const getTemplateBySlug = (slug: string) => {
	return CommunityTemplate.findOne({
		where: { slug },
		include: [{ model: User, as: 'createdBy', attributes: ['id', 'fullName', 'avatar'] }],
	});
};

export const getAllTemplates = async () => {
	const templates = await CommunityTemplate.findAll({
		order: [['title', 'ASC']],
		include: [
			{ model: User, as: 'createdBy', attributes: ['id', 'fullName', 'avatar'] },
			{ model: Hub, as: 'hub', attributes: ['id', 'slug', 'title'] },
		],
	});

	// Annotate each with communityCount
	const templateIds = templates.map((t) => t.id);

	const communityCounts = await Community.findAll({
		attributes: ['templateId', [sequelize.fn('COUNT', sequelize.col('id')), 'communityCount']],
		where: { templateId: { [Op.in]: templateIds } },
		group: ['templateId'],
		raw: true,
	});
	const communityCountMap = new Map(
		(communityCounts as any[]).map((r) => [r.templateId, parseInt(r.communityCount, 10)]),
	);

	const annotated = templates.map((t) => ({
		...t.toJSON(),
		communityCount: communityCountMap.get(t.id) ?? 0,
	}));

	return attachSourceCommunities(annotated);
};

export const updateTemplate = async (
	id: string,
	values: Partial<{
		slug: string;
		title: string;
		description: string | null;
		avatar: string | null;
		isActive: boolean;
		communityOverrides: TemplateCommunityOverrides;
		pages: TemplatePageDefinition[];
		collections: TemplateCollectionDefinition[];
		navigation: TemplateNavigationEntry[] | null;
		footerLinks: any[] | null;
		defaultMembers: TemplateDefaultMember[];
		facetOverrides: TemplateFacetOverrides;
		starterPubs: TemplateStarterPubDefinition[];
		customCSS: string | null;
	}>,
) => {
	const template = await CommunityTemplate.findByPk(id);
	if (!template) {
		throw new Error('Template not found');
	}
	if (values.slug) {
		values.slug = slugifyString(values.slug);
		const conflict = await CommunityTemplate.findOne({
			where: { slug: values.slug, id: { [Op.ne]: id } },
		});
		if (conflict) {
			throw new Error(`Template slug "${values.slug}" is already in use`);
		}
	}
	await template.update(values);
	return template;
};

export const destroyTemplate = async (id: string) => {
	const template = await CommunityTemplate.findByPk(id);
	if (!template) {
		throw new Error('Template not found');
	}
	await template.destroy();
};

// ─── Hub ↔ Template ──────────────────────────────────────────────

/** Get all templates belonging to a hub */
export const getTemplatesForHub = async (hubId: string) => {
	return CommunityTemplate.findAll({
		where: { hubId },
		order: [['title', 'ASC']],
		attributes: {
			include: [
				[
					sequelize.literal(
						`(SELECT COUNT(*) FROM "Communities" WHERE "Communities"."templateId" = "CommunityTemplate"."id")`,
					),
					'communityCount',
				],
			],
		},
		include: [{ model: User, as: 'createdBy', attributes: ['id', 'fullName', 'avatar'] }],
	});
};

/** Get active templates for a hub (public-facing, for community creation flow) */
export const getActiveTemplatesForHub = async (hubId: string) => {
	const templates = await CommunityTemplate.findAll({
		where: { hubId, isActive: true },
		order: [['title', 'ASC']],
	});
	// Only expose public-safe fields (this endpoint is unauthenticated)
	return templates.map((t) => {
		const json = t.toJSON();
		return {
			id: json.id,
			slug: json.slug,
			title: json.title,
			description: json.description,
			avatar: json.avatar,
		};
	});
};

// ─── Create Template from Existing Community ─────────────────────

/**
 * Resolve a community URL (or hostname) to a Community record.
 * Accepts formats like:
 *   - https://my-community.pubpub.org
 *   - my-community.pubpub.org
 *   - https://custom-domain.com
 *   - custom-domain.com
 */
export const findCommunityByUrl = async (input: string) => {
	let hostname: string;
	try {
		// If user passed a bare hostname, prefix with https:// so URL() can parse it
		const normalized = input.includes('://') ? input : `https://${input}`;
		hostname = new URL(normalized).hostname.toLowerCase();
	} catch {
		throw new Error(`Invalid URL: "${input}"`);
	}

	// Check if it's a *.pubpub.org subdomain
	const pubpubMatch = hostname.match(/^([a-z0-9-]+)\.pubpub\.org$/);
	if (pubpubMatch) {
		const community = await Community.findOne({
			where: { subdomain: pubpubMatch[1] },
			attributes: ['id', 'subdomain', 'title'],
		});
		if (community) return community;
	}

	// Otherwise try matching as a custom domain
	const community = await Community.findOne({
		where: { domain: hostname },
		attributes: ['id', 'subdomain', 'title'],
	});
	if (community) return community;

	throw new Error(`No community found for "${input}"`);
};

/**
 * Read facet settings that have been explicitly set at the community scope.
 * Returns only values that differ from system defaults.
 */
async function extractFacetOverridesForCommunity(
	communityId: string,
): Promise<TemplateFacetOverrides> {
	const bindings = await FacetBinding.findAll({ where: { communityId } });
	if (bindings.length === 0) return {};
	const bindingIds = bindings.map((b: any) => b.id);
	const overrides: TemplateFacetOverrides = {};
	await Promise.all(
		Object.entries(facetModels).map(async ([name, FacetModel]) => {
			const instance = await (FacetModel as any).findOne({
				where: { facetBindingId: bindingIds },
			});
			if (!instance) return;
			const definition = ALL_FACET_DEFINITIONS[name];
			if (!definition) return;
			const props: Record<string, any> = {};
			for (const propName of Object.keys(definition.props)) {
				const val = instance[propName];
				if (val !== null && val !== undefined) {
					props[propName] = val;
				}
			}
			if (Object.keys(props).length > 0) {
				(overrides as any)[name] = props;
			}
		}),
	);
	return overrides;
}

export const createTemplateFromCommunity = async (
	communityId: string,
	options: {
		title: string;
		slug: string;
		description?: string | null;
		createdById?: string | null;
		includePages?: boolean;
		includeCollections?: boolean;
		includeStarterPubs?: boolean;
	},
) => {
	const community = await Community.findByPk(communityId, {
		include: [
			{ model: Page, as: 'pages' },
			{ model: Collection, as: 'collections' },
		],
	});
	if (!community) {
		throw new Error('Community not found');
	}

	// Extract community overrides from the current community settings
	// Note: footerLinks has its own top-level template column; avatar is kept here
	// because communityOverrides.avatar is applied to the new community
	const communityOverrides: TemplateCommunityOverrides = {};
	const overrideFields: (keyof TemplateCommunityOverrides)[] = [
		'heroTitle',
		'heroText',
		'heroLogo',
		'heroImage',
		'heroBackgroundImage',
		'heroBackgroundColor',
		'heroTextColor',
		'heroAlign',
		'heroPrimaryButton',
		'heroSecondaryButton',
		'hideHero',
		'hideHeaderLogo',
		'hideCreatePubButton',
		'headerColorType',
		'headerLogo',
		'useHeaderTextAccent',
		'useHeaderGradient',
		'headerLinks',
		'footerTitle',
		'footerImage',
		'footerLogoLink',
		'accentColorLight',
		'accentColorDark',
		'avatar',
		'favicon',
		'hideNav',
		'socialLinksLocation',
		'website',
		'twitter',
		'instagram',
		'mastodon',
		'linkedin',
		'bluesky',
		'github',
		'facebook',
		'email',
	];
	for (const field of overrideFields) {
		const value = (community as any)[field];
		if (value !== null && value !== undefined) {
			(communityOverrides as any)[field] = value;
		}
	}

	// Extract pages — only public pages (limit to 25)
	const pages: TemplatePageDefinition[] = [];
	if (options.includePages !== false) {
		const sourcePages = (community.pages ?? []).filter((p) => p.isPublic === true).slice(0, 25);
		for (const page of sourcePages) {
			pages.push({
				title: page.title,
				slug: page.slug,
				description: page.description,
				isPublic: page.isPublic,
				layout: stripStaleIdsFromLayout(page.layout),
				isNarrowWidth: (page as any).isNarrowWidth ?? false,
			});
		}
	}

	// Extract collections — only public collections (limit to 25)
	const collections: TemplateCollectionDefinition[] = [];
	if (options.includeCollections !== false) {
		const sourceCols = (community.collections ?? [])
			.filter((c) => c.isPublic === true)
			.slice(0, 25);
		for (const col of sourceCols) {
			collections.push({
				title: col.title,
				slug: col.slug,
				kind: col.kind as any,
				isPublic: col.isPublic ?? undefined,
				isRestricted: col.isRestricted ?? undefined,
				layout: stripStaleIdsFromLayout(col.layout),
				metadata: col.metadata ?? undefined,
			});
		}
	}

	// Build navigation from slugs (only include public pages/collections)
	const publicPageIds = new Set(
		(community.pages ?? []).filter((p) => p.isPublic === true).map((p) => p.id),
	);
	const publicCollectionIds = new Set(
		(community.collections ?? []).filter((c) => c.isPublic === true).map((c) => c.id),
	);
	const navigation = buildNavigationFromCommunity(
		community.navigation as any[],
		(community.pages ?? []).filter((p) => publicPageIds.has(p.id)),
		(community.collections ?? []).filter((c) => publicCollectionIds.has(c.id)),
	);

	// Extract facet settings from the community
	const facetOverrides = await extractFacetOverridesForCommunity(communityId);

	// Extract custom CSS
	const cssScript = await CustomScript.findOne({ where: { communityId, type: 'css' } });
	const customCSS = cssScript?.content || null;

	const slug = slugifyString(options.slug);
	const template = await createTemplate({
		slug,
		title: options.title,
		description: options.description ?? community.description,
		avatar: community.avatar,
		communityOverrides,
		pages,
		collections,
		navigation,
		footerLinks: community.footerLinks as any,
		defaultMembers: [],
		facetOverrides,
		starterPubs: [],
		customCSS,
		sourceCommunityId: communityId,
		createdById: options.createdById,
	});

	// Return template plus any truncation warnings
	const warnings: string[] = [];
	const totalPublicPages = (community.pages ?? []).filter((p) => p.isPublic === true).length;
	const totalPublicCollections = (community.collections ?? []).filter(
		(c) => c.isPublic === true,
	).length;
	const includedPages = Math.min(totalPublicPages, 25);
	const includedCollections = Math.min(totalPublicCollections, 25);
	if (totalPublicPages > 25) {
		warnings.push(`Only 25 of ${totalPublicPages} public pages were included.`);
	}
	if (totalPublicCollections > 25) {
		warnings.push(`Only 25 of ${totalPublicCollections} public collections were included.`);
	}
	warnings.push(`Created ${includedPages} page(s) and ${includedCollections} collection(s).`);

	return { template, warnings };
};

function buildNavigationFromCommunity(
	navEntries: any[] | null,
	pages: Page[],
	collections: Collection[],
): TemplateNavigationEntry[] | null {
	if (!navEntries) return null;

	const pageIdToSlug = new Map(pages.map((p) => [p.id, p.slug]));
	const collectionIdToSlug = new Map(collections.map((c) => [c.id, c.slug]));

	const convert = (entry: any): TemplateNavigationEntry | null => {
		if (entry.type === 'page') {
			const slug = pageIdToSlug.get(entry.id);
			if (slug === undefined) return null;
			return { type: 'page', slug };
		}
		if (entry.type === 'collection') {
			const slug = collectionIdToSlug.get(entry.id);
			if (slug === undefined) return null;
			return { type: 'collection', slug };
		}
		if (entry.children) {
			const children = entry.children.map(convert).filter(Boolean) as any[];
			if (children.length === 0) return null;
			return { id: entry.id, title: entry.title, children };
		}
		// External link
		if (entry.href) {
			return { id: entry.id, title: entry.title, href: entry.href };
		}
		return null;
	};

	return navEntries.map(convert).filter(Boolean) as TemplateNavigationEntry[];
}

/**
 * Strip source-community-specific IDs from layout blocks so they don't leak
 * into templates. Clears pubIds, collectionIds, defaultCollectionIds, items
 * with stale UUIDs, and submissionWorkflowId references.
 */
function stripStaleIdsFromLayout(layout: any): any {
	if (!layout) return layout;
	// Handle CollectionLayout (has .blocks) or page layout (is array)
	const blocks: any[] = Array.isArray(layout) ? layout : layout.blocks;
	if (!blocks) return layout;

	const cleanedBlocks = blocks.map((block: any) => {
		if (!block?.content) return block;
		const content = { ...block.content };

		switch (block.type) {
			case 'pubs':
				// Remove pinned pub IDs and collection filter IDs from source community
				content.pubIds = [];
				content.collectionIds = [];
				break;
			case 'banner':
				// Remove source community collection IDs
				content.defaultCollectionIds = [];
				break;
			case 'collections-pages':
				// Remove items referencing source community page/collection IDs
				content.items = [];
				break;
			case 'submission-banner':
				// Remove source community workflow ID
				content.submissionWorkflowId = '';
				break;
			default:
				break;
		}
		return { ...block, content };
	});

	return Array.isArray(layout) ? cleanedBlocks : { ...layout, blocks: cleanedBlocks };
}

// ─── Fetch Pub Content ───────────────────────────────────────────

/**
 * Extract the pub slug and community hostname from a PubPub URL.
 * Accepts formats like:
 *   - https://community.pubpub.org/pub/my-slug
 *   - https://community.pubpub.org/pub/my-slug/release/3
 *   - my-slug (bare slug — no community scoping)
 */
function extractPubSlug(pubUrl: string): string {
	const trimmed = pubUrl.trim();
	// If it looks like a URL, parse the /pub/<slug> segment
	if (trimmed.includes('/') || trimmed.includes('.')) {
		try {
			const normalized = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
			const parsed = new URL(normalized);
			const segments = parsed.pathname.split('/').filter(Boolean);
			const pubIdx = segments.indexOf('pub');
			if (pubIdx !== -1 && segments[pubIdx + 1]) {
				return segments[pubIdx + 1].toLowerCase();
			}
		} catch {
			// fall through to treat as bare slug
		}
	}
	// Treat as a bare slug
	return trimmed.toLowerCase();
}

/**
 * Given a pub URL or slug, fetch the latest release's DocJson.
 * Pub slugs are globally unique, so no community scoping is needed.
 * Only returns content from released (public) pubs.
 */
export const fetchPubContent = async (pubUrl: string) => {
	const slug = extractPubSlug(pubUrl);

	const pub = await Pub.findOne({
		where: { slug },
		attributes: ['id', 'slug', 'title'],
	});
	if (!pub) {
		throw new Error(`No pub found with slug "${slug}"`);
	}

	// Only return content from released (public) pubs
	const release = await Release.findOne({
		where: { pubId: pub.id },
		include: [{ model: Doc, as: 'doc' }],
		order: [['historyKey', 'DESC']],
	});
	if (!release) {
		throw new Error(`Pub "${slug}" has no published releases and cannot be imported`);
	}
	if (!release.doc?.content) {
		throw new Error(`Pub "${slug}" release has no content`);
	}
	return { content: release.doc.content, title: pub.title, slug: pub.slug };
};

/**
 * Given a page URL, resolve the community and fetch the page data (title, slug, layout, etc.).
 * Page URLs look like: https://community.pubpub.org/page-slug
 * The slug is the first path segment (pages are top-level routes, not under /page/).
 */
export const fetchPageByUrl = async (pageUrl: string) => {
	const { communityId, slug } = await resolveUrlToCommunityAndSlug(pageUrl);

	const page = await Page.findOne({
		where: { communityId, slug },
		attributes: ['id', 'title', 'slug', 'description', 'isPublic', 'layout', 'isNarrowWidth'],
	});
	if (!page) {
		throw new Error(`No page found with slug "${slug}" in that community`);
	}

	return {
		title: page.title,
		slug: page.slug,
		description: page.description,
		isPublic: page.isPublic,
		layout: page.layout,
		isNarrowWidth: (page as any).isNarrowWidth ?? false,
	};
};

/**
 * Given a collection URL, resolve the community and fetch the collection data.
 * Collection URLs look like: https://community.pubpub.org/collection-slug
 */
export const fetchCollectionByUrl = async (collectionUrl: string) => {
	const { communityId, slug } = await resolveUrlToCommunityAndSlug(collectionUrl);

	const collection = await Collection.findOne({
		where: { communityId, slug },
		attributes: [
			'id',
			'title',
			'slug',
			'kind',
			'isPublic',
			'isRestricted',
			'layout',
			'metadata',
		],
	});
	if (!collection) {
		throw new Error(`No collection found with slug "${slug}" in that community`);
	}

	return {
		title: collection.title,
		slug: collection.slug,
		kind: collection.kind as any,
		isPublic: collection.isPublic ?? undefined,
		isRestricted: collection.isRestricted ?? undefined,
		layout: collection.layout,
		metadata: collection.metadata ?? undefined,
	};
};

/**
 * Parse a PubPub URL into a community ID and path slug.
 * Supports *.pubpub.org subdomains and custom domains.
 */
async function resolveUrlToCommunityAndSlug(
	input: string,
): Promise<{ communityId: string; slug: string }> {
	const trimmed = input.trim();
	const normalized = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
	let hostname: string;
	let pathname: string;
	try {
		const parsed = new URL(normalized);
		hostname = parsed.hostname.toLowerCase();
		pathname = parsed.pathname;
	} catch {
		throw new Error(`Invalid URL: "${input}"`);
	}

	// Resolve community
	let community: Community | null = null;
	const pubpubMatch = hostname.match(/^([a-z0-9-]+)\.pubpub\.org$/);
	if (pubpubMatch) {
		community = await Community.findOne({
			where: { subdomain: pubpubMatch[1] },
			attributes: ['id'],
		});
	} else {
		community = await Community.findOne({
			where: { domain: hostname },
			attributes: ['id'],
		});
	}
	if (!community) {
		throw new Error(`No community found for "${hostname}"`);
	}

	// Extract slug — first non-empty path segment
	const segments = pathname.split('/').filter(Boolean);
	const slug = segments[0];
	if (!slug) {
		throw new Error('URL does not contain a page or collection slug');
	}

	return { communityId: community.id, slug: slug.toLowerCase() };
}
