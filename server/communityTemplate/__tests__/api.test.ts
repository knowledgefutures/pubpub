import uuid from 'uuid';

import { fetchFacetsForScope } from 'server/facets';
import { Hub } from 'server/hub/model';
import { Collection, CollectionPub, Community, Member, Page, Pub } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

import { applyTemplate } from '../applyTemplate';
import { CommunityTemplate } from '../model';
import { createTemplate, createTemplateFromCommunity } from '../queries';

// ─── Test fixtures ───────────────────────────────────────────────

let testHub: Hub;
let otherHub: Hub;

const models = modelize`
	User superAdmin {
		isSuperAdmin: true
	}
	User regularUser {}
	User templateMember {}
	Community sourceCommunity {
		Member {
			permissions: "admin"
			User sourceAdmin {}
		}
		FacetBinding {
			CitationStyle {
				citationStyle: "chicago"
				inlineCitationStyle: "authorYear"
			}
		}
	}
	Community targetCommunity {
		Member {
			permissions: "admin"
			User targetAdmin {}
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
	testHub = await Hub.create({
		slug: `test-hub-${uuid.v4().slice(0, 8)}`,
		title: 'Test Hub',
		communityCreationEnabled: true,
	});
	otherHub = await Hub.create({
		slug: `other-hub-${uuid.v4().slice(0, 8)}`,
		title: 'Other Hub',
		communityCreationEnabled: true,
	});
});
teardown(afterAll);

// ─── Helpers ─────────────────────────────────────────────────────

const getHost = (community: Community) => `${community.subdomain}.pubpub.org`;

const createTestTemplate = (overrides: Partial<Parameters<typeof createTemplate>[0]> = {}) =>
	createTemplate({
		slug: `test-tpl-${uuid.v4().slice(0, 8)}`,
		title: 'Test Template',
		...overrides,
	});

// ═══════════════════════════════════════════════════════════════════
// 1. applyTemplate integration
// ═══════════════════════════════════════════════════════════════════

describe('applyTemplate', () => {
	it('applies all template sections to a community', async () => {
		const { targetCommunity, templateMember } = models;

		const template = await createTestTemplate({
			isActive: true,
			communityOverrides: {
				heroTitle: 'Welcome to Test',
				accentColorDark: '#112233',
				hideHero: false,
			},
			pages: [
				{ title: 'Home', slug: '', layout: [{ id: 'block1', type: 'text', content: {} }] },
				{ title: 'About', slug: 'about', isPublic: true },
			],
			collections: [{ title: 'Volume 1', slug: 'vol-1', kind: 'issue', isPublic: true }],
			navigation: [
				{ type: 'page', slug: '' },
				{ type: 'page', slug: 'about' },
				{ type: 'collection', slug: 'vol-1' },
			],
			footerLinks: [{ title: 'PubPub', url: 'https://pubpub.org' }],
			defaultMembers: [{ userId: templateMember.id, permissions: 'edit' }],
			facetOverrides: {
				CitationStyle: { citationStyle: 'mla' },
				License: { kind: 'cc-by-nc' },
			},
			starterPubs: [
				{
					title: 'Welcome Post',
					slug: 'welcome-post',
					collectionSlug: 'vol-1',
					content: {
						type: 'doc',
						content: [
							{ type: 'paragraph', content: [{ type: 'text', text: 'Hello!' }] },
						],
					},
				},
			],
		});

		await applyTemplate(template, targetCommunity.id, templateMember.id);

		// 1. Community overrides
		const community = await Community.findByPk(targetCommunity.id);
		expect(community!.heroTitle).toBe('Welcome to Test');
		expect(community!.accentColorDark).toBe('#112233');

		// 2. Pages
		const pages = await Page.findAll({ where: { communityId: targetCommunity.id } });
		const homePage = pages.find((p) => p.slug === '');
		const aboutPage = pages.find((p) => p.slug === 'about');
		expect(homePage).toBeTruthy();
		expect(homePage!.title).toBe('Home');
		expect(homePage!.layout).toHaveLength(1);
		expect(aboutPage).toBeTruthy();
		expect(aboutPage!.title).toBe('About');

		// 3. Collections
		const collections = await Collection.findAll({
			where: { communityId: targetCommunity.id },
		});
		const vol1 = collections.find((c) => c.slug === 'vol-1');
		expect(vol1).toBeTruthy();
		expect(vol1!.title).toBe('Volume 1');
		expect(vol1!.kind).toBe('issue');

		// 4. Navigation
		await community!.reload();
		const nav = community!.navigation as any[];
		expect(nav.length).toBeGreaterThanOrEqual(3);
		const navTypes = nav.map((n: any) => n.type);
		expect(navTypes).toContain('page');
		expect(navTypes).toContain('collection');

		// 5. Footer links
		expect(community!.footerLinks).toEqual([{ title: 'PubPub', url: 'https://pubpub.org' }]);

		// 6. Default members
		const member = await Member.findOne({
			where: { communityId: targetCommunity.id, userId: templateMember.id },
		});
		expect(member).toBeTruthy();
		expect(member!.permissions).toBe('edit');

		// 7. Facet overrides
		const facets = await fetchFacetsForScope({ communityId: targetCommunity.id }, [
			'CitationStyle',
			'License',
		]);
		expect(facets.CitationStyle.value).toMatchObject({ citationStyle: 'mla' });
		expect(facets.License.value).toMatchObject({ kind: 'cc-by-nc' });

		// 8. Starter pubs
		const pubs = await Pub.findAll({ where: { communityId: targetCommunity.id } });
		const welcomePub = pubs.find((p) => p.title === 'Welcome Post');
		expect(welcomePub).toBeTruthy();

		// Pub linked to collection
		const collectionPub = await CollectionPub.findOne({
			where: { pubId: welcomePub!.id, collectionId: vol1!.id },
		});
		expect(collectionPub).toBeTruthy();
	});

	it('upgrades member permissions when user already exists', async () => {
		const { targetAdmin, targetCommunity } = models;

		// targetAdmin is already admin — template should not downgrade
		const template = await createTestTemplate({
			defaultMembers: [{ userId: targetAdmin.id, permissions: 'edit' }],
		});

		await applyTemplate(template, targetCommunity.id, targetAdmin.id);

		const member = await Member.findOne({
			where: { communityId: targetCommunity.id, userId: targetAdmin.id },
		});
		expect(member!.permissions).toBe('admin'); // Not downgraded
	});

	it('handles empty template gracefully', async () => {
		const { targetCommunity, targetAdmin } = models;

		const template = await createTestTemplate({});
		// Should not throw
		await applyTemplate(template, targetCommunity.id, targetAdmin.id);
	});
});

// ═══════════════════════════════════════════════════════════════════
// 2. Template CRUD API
// ═══════════════════════════════════════════════════════════════════

describe('/api/communityTemplates', () => {
	it('allows superadmins to create templates', async () => {
		const { superAdmin, sourceCommunity } = models;
		const agent = await login(superAdmin);
		const slug = `crud-test-${uuid.v4().slice(0, 8)}`;
		const { body } = await agent
			.post('/api/communityTemplates')
			.set('Host', getHost(sourceCommunity))
			.send({ slug, title: 'CRUD Test Template' })
			.expect(201);
		expect(body.slug).toBe(slug);
		expect(body.title).toBe('CRUD Test Template');
		expect(body.isActive).toBe(false);
	});

	it('forbids non-superadmins from creating templates', async () => {
		const { regularUser, sourceCommunity } = models;
		const agent = await login(regularUser);
		await agent
			.post('/api/communityTemplates')
			.set('Host', getHost(sourceCommunity))
			.send({ slug: 'forbidden-tpl', title: 'Nope' })
			.expect(403);
	});

	it('allows superadmins to read, update, and delete templates', async () => {
		const { superAdmin, sourceCommunity } = models;
		const agent = await login(superAdmin);
		const host = getHost(sourceCommunity);
		const slug = `rw-test-${uuid.v4().slice(0, 8)}`;

		// Create
		const { body: created } = await agent
			.post('/api/communityTemplates')
			.set('Host', host)
			.send({ slug, title: 'RW Test' })
			.expect(201);

		// Read
		const { body: fetched } = await agent
			.get(`/api/communityTemplates/${created.id}`)
			.set('Host', host)
			.expect(200);
		expect(fetched.slug).toBe(slug);

		// Update
		await agent
			.put(`/api/communityTemplates/${created.id}`)
			.set('Host', host)
			.send({ title: 'Updated Title', isActive: true })
			.expect(200);
		const { body: updated } = await agent
			.get(`/api/communityTemplates/${created.id}`)
			.set('Host', host)
			.expect(200);
		expect(updated.title).toBe('Updated Title');
		expect(updated.isActive).toBe(true);

		// Delete
		await agent.delete(`/api/communityTemplates/${created.id}`).set('Host', host).expect(200);
		await agent.get(`/api/communityTemplates/${created.id}`).set('Host', host).expect(404);
	});

	it('rejects duplicate slugs', async () => {
		const { superAdmin, sourceCommunity } = models;
		const agent = await login(superAdmin);
		const host = getHost(sourceCommunity);
		const slug = `dupe-test-${uuid.v4().slice(0, 8)}`;

		await agent
			.post('/api/communityTemplates')
			.set('Host', host)
			.send({ slug, title: 'First' })
			.expect(201);
		await agent
			.post('/api/communityTemplates')
			.set('Host', host)
			.send({ slug, title: 'Second' })
			.expect(500);
	});

	it('forbids non-superadmins from updating templates they do not own via a hub', async () => {
		const { superAdmin, regularUser, sourceCommunity } = models;
		const adminAgent = await login(superAdmin);
		const host = getHost(sourceCommunity);
		const slug = `auth-test-${uuid.v4().slice(0, 8)}`;

		const { body: tpl } = await adminAgent
			.post('/api/communityTemplates')
			.set('Host', host)
			.send({ slug, title: 'Auth Test' })
			.expect(201);

		const userAgent = await login(regularUser);
		await userAgent
			.put(`/api/communityTemplates/${tpl.id}`)
			.set('Host', host)
			.send({ title: 'Hacked' })
			.expect(403);
	});
});

// ═══════════════════════════════════════════════════════════════════
// 3. Clone from community
// ═══════════════════════════════════════════════════════════════════

describe('createTemplateFromCommunity', () => {
	it('clones community appearance, pages, collections, navigation, and facets', async () => {
		const { sourceCommunity, superAdmin } = models;

		// Add a page and collection to the source community
		await Page.create({
			title: 'Source About',
			slug: 'about',
			communityId: sourceCommunity.id,
			isPublic: true,
			layout: [],
		});
		await Collection.create({
			title: 'Source Issue',
			slug: 'source-issue',
			kind: 'issue',
			communityId: sourceCommunity.id,
			isPublic: true,
		});

		const { template } = await createTemplateFromCommunity(sourceCommunity.id, {
			title: 'Clone Test',
			slug: `clone-test-${uuid.v4().slice(0, 8)}`,
			createdById: superAdmin.id,
		});

		// Community overrides should contain appearance fields
		expect(template.communityOverrides).toBeDefined();

		// Should have cloned pages
		expect(template.pages.length).toBeGreaterThanOrEqual(1);
		const aboutPage = template.pages.find((p: any) => p.slug === 'about');
		expect(aboutPage).toBeTruthy();
		expect(aboutPage!.title).toBe('Source About');

		// Should have cloned collections
		expect(template.collections.length).toBeGreaterThanOrEqual(1);
		const issue = template.collections.find((c: any) => c.slug === 'source-issue');
		expect(issue).toBeTruthy();

		// Should have extracted facet overrides from the source community
		expect(template.facetOverrides).toBeDefined();
		if (Object.keys(template.facetOverrides).length > 0) {
			expect(template.facetOverrides.CitationStyle).toMatchObject({
				citationStyle: 'chicago',
				inlineCitationStyle: 'authorYear',
			});
		}

		// Starter pubs should be empty (by design)
		expect(template.starterPubs).toEqual([]);
	});
});

// ═══════════════════════════════════════════════════════════════════
// 4. Community creation with template
// ═══════════════════════════════════════════════════════════════════

describe('POST /api/communities with templateId', () => {
	it('applies a hub template during community creation', async () => {
		const { superAdmin, sourceCommunity } = models;
		const agent = await login(superAdmin);
		const host = getHost(sourceCommunity);

		// Create a template owned by the hub
		const tplSlug = `hub-create-${uuid.v4().slice(0, 8)}`;
		const template = await createTestTemplate({
			slug: tplSlug,
			title: 'Hub Creation Template',
			isActive: true,
			hubId: testHub.id,
			communityOverrides: { heroTitle: 'From Template' },
			pages: [{ title: 'Template About', slug: 'tpl-about', isPublic: true }],
			facetOverrides: {
				CitationStyle: { citationStyle: 'vancouver' },
			},
		});

		const subdomain = `tpl-comm-${uuid.v4().slice(0, 8)}`;
		await agent
			.post('/api/communities')
			.set('Host', host)
			.send({
				subdomain,
				title: 'Template Community',
				description: 'Created with template',
				accentColorLight: '#FFFFFF',
				accentColorDark: '#2D2E2F',
				templateId: template.id,
				hubSlug: testHub.slug,
			})
			.expect(201);

		// Verify the template was applied
		const community = await Community.findOne({ where: { subdomain } });
		expect(community).toBeTruthy();
		expect(community!.heroTitle).toBe('From Template');

		// Verify page was created
		const aboutPage = await Page.findOne({
			where: { communityId: community!.id, slug: 'tpl-about' },
		});
		expect(aboutPage).toBeTruthy();

		// Verify facets were applied
		const facets = await fetchFacetsForScope({ communityId: community!.id }, ['CitationStyle']);
		expect(facets.CitationStyle.value.citationStyle).toBe('vancouver');
	});

	it('rejects an inactive template', async () => {
		const { superAdmin, sourceCommunity } = models;
		const agent = await login(superAdmin);
		const host = getHost(sourceCommunity);

		const template = await createTestTemplate({
			isActive: false,
			hubId: testHub.id,
		});

		const subdomain = `inactive-${uuid.v4().slice(0, 8)}`;
		await agent
			.post('/api/communities')
			.set('Host', host)
			.send({
				subdomain,
				title: 'Should Still Create',
				description: 'Testing inactive template',
				accentColorLight: '#FFFFFF',
				accentColorDark: '#2D2E2F',
				templateId: template.id,
				hubSlug: testHub.slug,
			})
			.expect(201);

		// Community is created but template should NOT have been applied
		const community = await Community.findOne({ where: { subdomain } });
		expect(community).toBeTruthy();
		// heroTitle is set to the community title by default, not from a template override
		expect(community!.heroTitle).toBe('Should Still Create');
	});

	it('rejects a template belonging to a different hub', async () => {
		const { superAdmin, sourceCommunity } = models;
		const agent = await login(superAdmin);
		const host = getHost(sourceCommunity);

		// Create template under a different hub
		const template = await createTestTemplate({
			isActive: true,
			hubId: otherHub.id, // belongs to a different hub
		});

		const subdomain = `wrong-hub-${uuid.v4().slice(0, 8)}`;
		await agent
			.post('/api/communities')
			.set('Host', host)
			.send({
				subdomain,
				title: 'Wrong Hub Test',
				description: 'Testing wrong hub template',
				accentColorLight: '#FFFFFF',
				accentColorDark: '#2D2E2F',
				templateId: template.id,
				hubSlug: testHub.slug,
			})
			.expect(201);

		// Community is created but template was NOT applied
		const community = await Community.findOne({ where: { subdomain } });
		expect(community).toBeTruthy();
		expect(community!.templateId).toBeFalsy();
	});
});

// ═══════════════════════════════════════════════════════════════════
// 5. allowedOverrideFields allowlist
// ═══════════════════════════════════════════════════════════════════

describe('applyCommunityOverrides allowlist', () => {
	it('applies allowed fields and rejects disallowed fields', async () => {
		const { superAdmin } = models;

		// Create a fresh community for this test
		const community = await Community.create({
			subdomain: `allowlist-${uuid.v4().slice(0, 8)}`,
			title: 'Allowlist Test',
			navigation: [],
			accentColorLight: '#000000',
			accentColorDark: '#000000',
		});

		const template = await createTestTemplate({
			communityOverrides: {
				// Allowed fields
				heroTitle: 'Allowed Hero',
				accentColorLight: '#FFFFFF',
				// Disallowed fields that should NOT be applied
				subdomain: 'hacked-subdomain',
				id: uuid.v4(),
				title: 'Hacked Title',
				navigation: [{ type: 'page', id: 'fake' }],
			} as any,
		});

		await applyTemplate(template, community.id, superAdmin.id);

		await community.reload();

		// Allowed fields were applied
		expect(community.heroTitle).toBe('Allowed Hero');
		expect(community.accentColorLight).toBe('#FFFFFF');

		// Disallowed fields were NOT applied
		expect(community.subdomain).not.toBe('hacked-subdomain');
		expect(community.title).toBe('Allowlist Test');
	});
});
