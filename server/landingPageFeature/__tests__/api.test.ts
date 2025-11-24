import { LandingPageFeature } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

const models = modelize`
	User superadmin {
        isSuperAdmin: true
    }
    Community c1 {
        Member {
            permissions: "admin"
            User rando {}
        }
        Pub p1 {
            Release {}
        }
        Pub p2 {
            Release {}
        }
        Pub p3 {}
    }
    LandingPageFeature l1 {
        pub: p1
        rank: "h"
    }
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

it('forbids non-superadmins from creating/modifying/deleting LandingPageFeatures', async () => {
	const { rando, l1, p2 } = models;
	const agent = await login(rando);
	await agent
		.post('/api/landingPageFeatures')
		.send({ proposal: p2.slug, proposalKind: 'pub' })
		.expect(403);
	await agent
		.put('/api/landingPageFeatures')
		.send({ landingPageFeature: { id: l1.id, rank: 'zzz' } })
		.expect(403);
	await agent
		.delete('/api/landingPageFeatures')
		.send({ landingPageFeature: { id: l1.id } })
		.expect(403);
});

it('allows superadmins to create/modify/delete LandingPageFeatures', async () => {
	const { superadmin, p2 } = models;
	const agent = await login(superadmin);
	const { body: l2 } = await agent
		.post('/api/landingPageFeatures')
		.send({ proposal: p2.slug, proposalKind: 'pub', rank: '0' })
		.expect(201);
	expect(l2.pubId).toEqual(p2.id);
	await agent
		.put('/api/landingPageFeatures')
		.send({ landingPageFeature: { id: l2.id, rank: 'zzz' } })
		.expect(200);
	await agent
		.delete('/api/landingPageFeatures')
		.send({ landingPageFeature: { id: l2.id } })
		.expect(200);
	expect(await LandingPageFeature.count({ where: { id: l2.id } })).toEqual(0);
});

it('will not create LandingPageFeatures for unreleased Pubs', async () => {
	const { superadmin, p3 } = models;
	const agent = await login(superadmin);
	await agent
		.post('/api/landingPageFeatures')
		.send({ proposal: p3.slug, proposalKind: 'pub' })
		.expect(404);
});
