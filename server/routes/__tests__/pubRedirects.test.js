/* global describe, it, expect, beforeAll, afterAll */
import { setup, teardown, stubFirebaseAdmin, login, modelize } from 'stubstub';

const models = modelize`
	Community community {
		Member {
			permissions: "view"
			User communityViewer {}
		}
		Pub draftPub {
			Member {
				permissions: "edit"
				User draftPubEditor {}
			}
		}
		Pub releasePub {
			Release {}
			Release {}
			Release {}
		}
	}
`;

stubFirebaseAdmin();

setup(beforeAll, async () => {
	await models.resolve();
});

const getHost = (community) => `${community.subdomain}.pubpub.org`;

describe('/pub', () => {
	it('302s from /pub/:slug to the draft for unreleased pubs', async () => {
		const { draftPub, draftPubEditor, community } = models;
		const agent = await login(draftPubEditor);
		const host = getHost(community);
		const { headers } = await agent
			.get(`/pub/${draftPub.slug}`)
			.set('Host', host)
			.expect(302);
		expect(headers.location).toEqual(`https://${host}/pub/${draftPub.slug}/draft`);
	});

	it('404s from /pub/:slug/draft for visitors without view permissions', async () => {
		const { draftPub, community } = models;
		const agent = await login();
		const host = getHost(community);
		await agent
			.get(`/pub/${draftPub.slug}/draft`)
			.set('Host', host)
			.expect(404);
	});

	it('302s from /pub/:slug to the latest release for visitors', async () => {
		const { releasePub, community } = models;
		const agent = await login();
		const host = getHost(community);
		const { headers } = await agent
			.get(`/pub/${releasePub.slug}`)
			.set('Host', host)
			.expect(302);
		expect(headers.location).toEqual(`https://${host}/pub/${releasePub.slug}/release/3`);
	});

	// it('404s for a user who has no permission to view the pub', async () => {
	// 	const agent = await login(visitor);
	// 	await agent
	// 		.get(`/pub/${pub.slug}`)
	// 		.set('Host', host)
	// 		.expect(404);
	// });

	// it('200s for a user seeking to visit the draft branch, when they have permission', async () => {
	// 	const agent = await login(pubManager);
	// 	await agent
	// 		.get(`/pub/${pub.slug}/branch/${draftBranch.shortId}`)
	// 		.set('Host', host)
	// 		.expect(200);
	// });

	// it('200s for a user seeking to visit another branch, when they have permission', async () => {
	// 	const agent = await login(userA);
	// 	await agent
	// 		.get(`/pub/${pub.slug}/branch/${branchA.shortId}`)
	// 		.set('Host', host)
	// 		.expect(200);
	// });

	// it('200s for a pub manager seeking to visit /manage', async () => {
	// 	const agent = await login(pubManager);
	// 	await agent
	// 		.get(`/pub/${pub.slug}/manage`)
	// 		.set('Host', host)
	// 		.expect(200);
	// });

	// it('200s for a pub manager seeking to visit #public, when it has content', async () => {
	// 	await publicBranch.update({ firstKeyAt: new Date() });
	// 	const agent = await login(pubManager);
	// 	await agent
	// 		.get(`/pub/${pub.slug}`)
	// 		.set('Host', host)
	// 		.expect(200);
	// });

	// it('200s for a user seeking to visit #public, when it has content', async () => {
	// 	await publicBranch.update({ firstKeyAt: new Date() });
	// 	const agent = await login(visitor);
	// 	await agent
	// 		.get(`/pub/${pub.slug}`)
	// 		.set('Host', host)
	// 		.expect(200);
	// });
});

teardown(afterAll);
