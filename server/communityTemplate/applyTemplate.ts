// Template application creates entities sequentially (pages, collections, members, pubs)
// because each may depend on the previous (slug uniqueness, ID references, etc.)
import type {
	TemplateCollectionDefinition,
	TemplateCommunityOverrides,
	TemplateDefaultMember,
	TemplateFacetOverrides,
	TemplateNavigationEntry,
	TemplatePageDefinition,
	TemplateStarterPubDefinition,
} from 'types';

import type { CommunityTemplate } from './model';

import uuidv4 from 'uuid/v4';

import { generateDefaultCollectionLayout } from 'server/collection/queries';
import { createCollectionPub } from 'server/collectionPub/queries';
import { setCustomScriptForCommunity } from 'server/customScript/queries';
import { updateFacetsForScope } from 'server/facets/update';
import { Collection, Community, Member, Page, Pub } from 'server/models';
import { findAcceptableSlug } from 'server/utils/slugs';
import { normalizeMetadataToKind } from 'utils/collections/metadata';
import { generateHash } from 'utils/hashes';
import { slugifyString } from 'utils/strings';

type SlugToIdMap = Record<string, string>;

/**
 * Apply a community template after the base community and home page have been created.
 * This is the core engine that turns a template blueprint into real community entities.
 */
export const applyTemplate = async (
	template: CommunityTemplate,
	communityId: string,
	actorId: string,
) => {
	const community = await Community.findByPk(communityId);
	if (!community) {
		throw new Error(`Community ${communityId} not found`);
	}

	// 1. Apply community overrides
	if (template.communityOverrides && Object.keys(template.communityOverrides).length > 0) {
		await applyCommunityOverrides(community, template.communityOverrides);
	}

	// 2. Create pages (replacing the default home page if a page with slug '' is in the template)
	const pageSlugToId = await applyPages(template.pages ?? [], communityId);

	// 3. Create collections
	const collectionSlugToId = await applyCollections(
		template.collections ?? [],
		communityId,
		actorId,
		community,
	);

	// 4. Build and set navigation
	if (template.navigation) {
		await applyNavigation(community, template.navigation, pageSlugToId, collectionSlugToId);
	}

	// 5. Set footer links
	if (template.footerLinks) {
		await community.update({ footerLinks: template.footerLinks });
	}

	// 6. Add default members
	if (template.defaultMembers && template.defaultMembers.length > 0) {
		await applyDefaultMembers(template.defaultMembers, communityId);
	}

	// 7. Apply facet overrides
	if (template.facetOverrides && Object.keys(template.facetOverrides).length > 0) {
		await applyFacetOverrides(template.facetOverrides, communityId, actorId);
	}

	// 8. Create starter pubs
	if (template.starterPubs && template.starterPubs.length > 0) {
		await applyStarterPubs(template.starterPubs, communityId, collectionSlugToId, actorId);
	}

	// 9. Apply custom CSS
	if (template.customCSS) {
		await setCustomScriptForCommunity(communityId, 'css', template.customCSS);
	}
};

/** Fields safe to apply from a template's communityOverrides to a new community. */
const allowedOverrideFields = new Set([
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
]);

async function applyCommunityOverrides(
	community: Community,
	overrides: TemplateCommunityOverrides,
) {
	const updateData: Record<string, any> = {};
	for (const [key, value] of Object.entries(overrides)) {
		if (value !== undefined && allowedOverrideFields.has(key)) {
			updateData[key] = value;
		}
	}
	if (Object.keys(updateData).length > 0) {
		await community.update(updateData);
	}
}

async function applyPages(
	pageDefs: TemplatePageDefinition[],
	communityId: string,
): Promise<SlugToIdMap> {
	const slugToId: SlugToIdMap = {};

	for (const pageDef of pageDefs) {
		const isHomePage = pageDef.slug === '';

		if (isHomePage) {
			// Replace the existing home page content
			// biome-ignore lint/performance/noAwaitInLoops: sequential entity creation
			const existingHome = await Page.findOne({
				where: { communityId, slug: '' },
			});
			if (existingHome) {
				const updateData: Record<string, any> = {};
				if (pageDef.title) updateData.title = pageDef.title;
				if (pageDef.layout) updateData.layout = pageDef.layout;
				if (pageDef.description !== undefined) updateData.description = pageDef.description;
				if (pageDef.isNarrowWidth !== undefined)
					updateData.isNarrowWidth = pageDef.isNarrowWidth;
				await existingHome.update(updateData);
				slugToId[''] = existingHome.id;
				continue;
			}
		}

		const pageId = uuidv4();
		await Page.create({
			id: pageId,
			title: pageDef.title,
			slug: isHomePage
				? ''
				: await findAcceptableSlug(slugifyString(pageDef.slug), communityId),
			communityId,
			isPublic: pageDef.isPublic ?? true,
			layout: pageDef.layout ?? [],
			description: pageDef.description ?? null,
			isNarrowWidth: pageDef.isNarrowWidth ?? false,
			viewHash: generateHash(8),
		});
		slugToId[pageDef.slug] = pageId;
	}

	return slugToId;
}

async function applyCollections(
	collectionDefs: TemplateCollectionDefinition[],
	communityId: string,
	actorId: string,
	community: Community,
): Promise<SlugToIdMap> {
	const slugToId: SlugToIdMap = {};

	for (const colDef of collectionDefs) {
		const collectionId = uuidv4();
		// biome-ignore lint/performance/noAwaitInLoops: sequential entity creation
		const slug = await findAcceptableSlug(slugifyString(colDef.slug), communityId);
		const metadata = normalizeMetadataToKind(colDef.metadata ?? {}, colDef.kind, {
			community,
			collection: { title: colDef.title, slug },
		});

		await Collection.create(
			{
				id: collectionId,
				title: colDef.title,
				slug,
				kind: colDef.kind,
				isPublic: colDef.isPublic ?? false,
				isRestricted: colDef.isRestricted ?? true,
				communityId,
				layout: colDef.layout ?? generateDefaultCollectionLayout(),
				metadata,
				viewHash: generateHash(8),
				editHash: generateHash(8),
			},
			{ returning: true, actorId },
		);
		slugToId[colDef.slug] = collectionId;
	}

	return slugToId;
}

function resolveNavEntry(
	entry: TemplateNavigationEntry,
	pageSlugToId: SlugToIdMap,
	collectionSlugToId: SlugToIdMap,
): any | null {
	if ('type' in entry && 'slug' in entry) {
		const map = entry.type === 'page' ? pageSlugToId : collectionSlugToId;
		const id = map[entry.slug];
		if (!id) return null; // Skip entries whose target wasn't created
		return { type: entry.type, id };
	}
	if ('children' in entry) {
		const children = entry.children
			.map((child) => resolveNavEntry(child, pageSlugToId, collectionSlugToId))
			.filter(Boolean);
		if (children.length === 0) return null;
		return { id: entry.id || uuidv4(), title: entry.title, children };
	}
	// External link — pass through
	return entry;
}

async function applyNavigation(
	community: Community,
	navEntries: TemplateNavigationEntry[],
	pageSlugToId: SlugToIdMap,
	collectionSlugToId: SlugToIdMap,
) {
	// Start with the existing home page in navigation
	const existingNav = (community.navigation as any[]) ?? [];

	const resolved = navEntries
		.map((entry) => resolveNavEntry(entry, pageSlugToId, collectionSlugToId))
		.filter(Boolean);

	// If the template didn't reference the home page, prepend it
	const homePageId = pageSlugToId[''] || existingNav.find((e: any) => e.type === 'page')?.id;
	const hasHomeInResolved = resolved.some((e: any) => e.type === 'page' && e.id === homePageId);
	const finalNav = hasHomeInResolved ? resolved : [{ type: 'page', id: homePageId }, ...resolved];

	await community.update({ navigation: finalNav });
}

async function applyDefaultMembers(members: TemplateDefaultMember[], communityId: string) {
	for (const memberDef of members) {
		// Check if this user is already a member (e.g., the creator)
		// biome-ignore lint/performance/noAwaitInLoops: sequential member checks
		const existing = await Member.findOne({
			where: { communityId, userId: memberDef.userId },
		});
		if (existing) {
			// Upgrade permissions if the template specifies a higher level
			const permissionOrder = ['view', 'edit', 'manage', 'admin'];
			const currentLevel = permissionOrder.indexOf(existing.permissions);
			const desiredLevel = permissionOrder.indexOf(memberDef.permissions);
			if (desiredLevel > currentLevel) {
				await existing.update({ permissions: memberDef.permissions });
			}
			continue;
		}
		// Skip hooks to avoid sending welcome/notification emails for
		// template-injected members during community creation.
		await Member.create(
			{
				communityId,
				userId: memberDef.userId,
				permissions: memberDef.permissions,
			},
			{ hooks: false },
		);
	}
}

async function applyFacetOverrides(
	facetOverrides: TemplateFacetOverrides,
	communityId: string,
	actorId: string,
) {
	await updateFacetsForScope({ communityId }, facetOverrides, actorId);
}

async function applyStarterPubs(
	pubDefs: TemplateStarterPubDefinition[],
	communityId: string,
	collectionSlugToId: SlugToIdMap,
	actorId: string,
) {
	// Lazy import to avoid circular dependency (resolved once by Node.js module cache)
	const { createPub } = await import('server/pub/queries.js');
	const { upsertDraftCheckpoint } = await import('server/draftCheckpoint/queries.js');

	for (const pubDef of pubDefs) {
		const collectionIds: string[] = [];
		if (pubDef.collectionSlug && collectionSlugToId[pubDef.collectionSlug]) {
			collectionIds.push(collectionSlugToId[pubDef.collectionSlug]);
		}

		// biome-ignore lint/performance/noAwaitInLoops: sequential pub creation
		const newPub = await createPub(
			{
				communityId,
				title: pubDef.title,
				slug: pubDef.slug ? slugifyString(pubDef.slug) : undefined,
				collectionIds: collectionIds.length > 0 ? collectionIds : undefined,
			},
			actorId,
		);

		// Write initial content to a DraftCheckpoint in Postgres.
		// The editor hydrates from the checkpoint on first load, so no
		// Firebase write is needed for starter content.
		if (pubDef.content && newPub.draftId) {
			try {
				await upsertDraftCheckpoint(newPub.draftId, 0, pubDef.content, Date.now());
			} catch (err) {
				// Log but don't fail template application for content write errors
				console.error(`Failed to write starter content for pub "${pubDef.title}":`, err);
			}
		}
	}
}
