import { vi } from 'vitest';

import { createPubEdge } from 'server/pubEdge/queries';
import { finishDeferredTasks } from 'server/utils/deferred';
import { login, modelize, setup, teardown } from 'stubstub';
import { setEnvironment } from 'utils/environment';

import { getCorrectHostname } from '../getCorrectHostname';
import { getPPLic } from '../getHashedUserId';

const superAdminConfig = {
	id: crypto.randomUUID(),
	name: 'Super Admin',
	slug: `${crypto.randomUUID()}-super-admin`,
	isSuperAdmin: true,
};

const testCommunitySubdomain = `${crypto.randomUUID()}-test`;
const communityTestPubSlug = `${crypto.randomUUID()}-test-pub`;

const connectionCommunitySubdomain = `${crypto.randomUUID()}-connection`;

const fakeCommunitySubdomain = `${crypto.randomUUID()}-fake`;
const fakeCommunityDomain = `${fakeCommunitySubdomain}.fake.com`;
const collectionAttributionCommunitySubdomain = `${crypto.randomUUID()}-collection`;
const communityMemberCommunityDomain = `${crypto.randomUUID()}-member.com`;
const pubMemberCommunityDomain = `${crypto.randomUUID()}-pub.com`;
const collectionMemberCommunityDomain = `${crypto.randomUUID()}-collection.com`;
const releaseTestCommunityDomain = `${crypto.randomUUID()}-release.com`;
const releaseTestPubSlug = `${crypto.randomUUID()}-release-test-pub`;

const models = modelize`
	User superAdmin {
		id: ${superAdminConfig.id}
		name: ${superAdminConfig.name}
		slug: ${superAdminConfig.slug}
		isSuperAdmin: ${superAdminConfig.isSuperAdmin}
	}
		
    Community community {
		subdomain: ${testCommunitySubdomain}
        Pub testPub {
            slug: ${communityTestPubSlug}
			Release testRelease {
				createdAt: "2020-01-01"
				historyKey: 1
			}
			PubAttribution {
				userId: ${superAdminConfig.id}
				affiliation: "test"
				order: 0.5
			}
        }
        Member {
            permissions: "admin"
            User admin {}
        }
        Page testPage {
            title: "test page"
            slug: "test-page"
        }
    }

	Community connectionCommunity {
		subdomain: ${connectionCommunitySubdomain}
		Pub connectionPub {
			title: "connection pub"
			PubAttribution {
				userId: ${superAdminConfig.id}
				affiliation: "test"
				order: 0.5
			}
			Release release {
				createdAt: "2020-01-01"
				historyKey: 1
			}
		}
	}

	Community fakeCommunity {
		subdomain: ${fakeCommunitySubdomain}
		domain: ${fakeCommunityDomain}
		Pub fakePub {
			title: "fake pub"
			Release fakeRelease {
				createdAt: "2020-01-01"
				historyKey: 1
			}
			PubAttribution {
				userId: ${superAdminConfig.id}
				affiliation: "test"
				order: 0.5
			}
		}
	}

	Community collectionAttributionCommunity {
		subdomain: ${collectionAttributionCommunitySubdomain}
		Collection collection {
			CollectionAttribution {
				userId: ${superAdminConfig.id}
				affiliation: "test"
				order: 0.5
			}
		}
	}

	Community communityMemberCommunity {
		domain: ${communityMemberCommunityDomain}
		Member {
			userId: ${superAdminConfig.id}
		}
	}

	Community pubMemberCommunity {
		domain: ${pubMemberCommunityDomain}
		Pub {
			Member {
				userId: ${superAdminConfig.id}
			}
		}
	}

	Community collectionMemberCommunity {
		domain: ${collectionMemberCommunityDomain}
		Collection {
			Member {
				userId: ${superAdminConfig.id}
			}
		}
	}

	Community releaseTestCommunity {
		domain: ${releaseTestCommunityDomain}
		Pub releaseTestPub {
			slug: ${releaseTestPubSlug}
			PubAttribution {
				userId: ${superAdminConfig.id}
				affiliation: "test"
				order: 0.5
			}
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();

	process.env.TEST_FASTLY_PURGE = '1';

	// mock fetch, we don't actually want to send api calls
	vi.spyOn(global, 'fetch').mockImplementation(
		() =>
			Promise.resolve({
				json: () => Promise.resolve({ status: 'ok', id: 'id' }),
			}) as unknown as Promise<Response>,
	);
});

teardown(afterAll, () => {
	delete process.env.TEST_FASTLY_PURGE;
	setEnvironment(false, false, false);

	vi.restoreAllMocks();
});

const expectFastlyPurge = ({
	key,
	token = process.env.FASTLY_PURGE_TOKEN_PROD,
	serviceId = process.env.FASTLY_SERVICE_ID_PROD,
}: {
	key: string;
	token?: string;
	serviceId?: string;
}) => {
	expect(global.fetch).toHaveBeenCalledWith(
		`https://api.fastly.com/service/${serviceId}/purge/${key}`,
		{
			headers: {
				Accept: 'application/json',
				'Fastly-Key': token,
			},
			method: 'POST',
		},
	);
};

describe('purging', () => {
	beforeEach(() => {
		// reset "has been called" status of all mocks
		vi.clearAllMocks();
		setEnvironment(false, false, false);
	});
	it('should purge on creating collection', async () => {
		const { community, admin } = models;

		const agent = await login(admin);
		await agent
			.post('/api/collections')
			.send({ communityId: community.id, title: 'test collection', kind: 'tag' })
			.expect(201);

		await finishDeferredTasks();

		expectFastlyPurge({ key: 'demo.pubpub.org' });
	});
	it('should not purge on GET routes, non-API routes, and certain excluded routes', async () => {
		const { community, admin, testPub, testPage } = models;

		const agent = await login(admin);

		const host = `${community.subdomain}.pubpub.org`;
		const callsThatShouldntPurge = [
			agent.get('/api/collections').set('Host', host).send().expect(200),
			agent.get(`/${testPage.slug}`).set('Host', host).send().expect(200),
			agent
				.post('/api/export')
				.set('Host', host)
				.send({
					pubId: testPub.id,
					format: 'pdf',
					communityId: community.id,
				})
				.expect(201),
		];

		await Promise.all(callsThatShouldntPurge);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(0);
	}, 70000);

	it('should debounce purges', async () => {
		const { community, admin } = models;

		const agent = await login(admin);

		const callsThatShouldPurge = [
			agent.post('/api/collections').send({
				communityId: community.id,
				title: 'test collection',
				kind: 'tag',
			}),
			agent.post('/api/collections').send({
				communityId: community.id,
				title: 'test collection',
				kind: 'tag',
			}),
			agent.post('/api/collections').send({
				communityId: community.id,
				title: 'test collection',
				kind: 'tag',
			}),
			agent.post('/api/collections').send({
				communityId: community.id,
				title: 'test collection',
				kind: 'tag',
			}),
			agent.post('/api/collections').send({
				communityId: community.id,
				title: 'test collection',
				kind: 'tag',
			}),
		];

		await Promise.all(callsThatShouldPurge);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(1);
	}, 50000);

	it('should not debounce purges of different tags', async () => {
		const { community, admin } = models;

		const agent = await login(admin);

		const host = `something.pubpub.org`;
		const fakeHost = 'fake.pubpub.org';

		const callsThatShouldPurge = [
			agent
				.post('/api/collections')
				.send({
					communityId: community.id,
					title: 'test collection',
					kind: 'tag',
				})
				.set('Host', host),
			agent
				.post('/api/collections')
				.send({
					communityId: community.id,
					title: 'test collection',
					kind: 'tag',
				})
				.set('Host', fakeHost),
			agent
				.post('/api/collections')
				.send({
					communityId: community.id,
					title: 'test collection',
					kind: 'tag',
				})
				.set('Host', host),
			agent
				.post('/api/collections')
				.send({
					communityId: community.id,
					title: 'test collection',
					kind: 'tag',
				})
				.set('Host', fakeHost),
		];

		await Promise.all(callsThatShouldPurge);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(2);
		expectFastlyPurge({ key: 'something.pubpub.org' });
		expectFastlyPurge({ key: 'fake.pubpub.org' });
	}, 50000);

	it('should not purge on qubqub', async () => {
		const { community, admin } = models;

		const agent = await login(admin);

		setEnvironment(false, false, true);
		const host = `something.pubpub.org`;

		await agent
			.post('/api/collections')
			.send({
				communityId: community.id,
				title: 'test collection',
				kind: 'tag',
			})
			.set('Host', host)
			.expect(201);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(0);

		setEnvironment(false, false, false);

		await agent
			.post('/api/collections')
			.send({
				communityId: community.id,
				title: 'test',
				kind: 'tag',
			})
			.set('Host', host)
			.expect(201);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it('should purge the appropriate host depending on env', async () => {
		const { community, admin } = models;

		setEnvironment(false, true, false);

		const agent = await login(admin);

		const host = `something.pubpub.org`;

		await agent
			.post('/api/collections')
			.send({
				communityId: community.id,
				title: 'test',
				kind: 'tag',
			})
			.set('Host', host)
			.expect(201);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(1);
		expectFastlyPurge({
			key: 'something.duqduq.org',
			token: process.env.FASTLY_PURGE_TOKEN_DUQDUQ,
			serviceId: process.env.FASTLY_SERVICE_ID_DUQDUQ,
		});
	});
});

describe('surrogate keys', () => {
	beforeEach(() => {
		// reset "has been called" status of all mocks
		vi.clearAllMocks();
		setEnvironment(false, false, false);
	});
	beforeAll(async () => {
		const { connectionPub, fakePub, testPub } = models;

		await Promise.all([
			createPubEdge({
				pubId: connectionPub.id,
				pubIsParent: true,
				relationType: 'comment',
				targetPubId: testPub.id,
				approvedByTarget: true,
			}),
			createPubEdge({
				pubId: fakePub.id,
				pubIsParent: true,
				relationType: 'rejoinder',
				targetPubId: connectionPub.id,
				approvedByTarget: true,
			}),
		]);
	});

	it('should return all the hostnames of every connected pub on release pages', async () => {
		const { connectionPub } = models;

		const agent = await login();

		const result = await agent
			.get(`/pub/${connectionPub.slug}/release/1`)
			.set('Host', `${connectionCommunitySubdomain}.pubpub.org`)
			.expect(200);

		const surrogateKeys = result.headers['surrogate-key']?.split(' ').sort();

		expect(surrogateKeys).toMatchObject(
			[
				fakeCommunityDomain,
				`${connectionCommunitySubdomain}.pubpub.org`,
				`${testCommunitySubdomain}.pubpub.org`,
			].sort(),
		);
	}, 20_000);

	it('should return all the hostnames of every released authored pub, user slug, and hostname on user pages', async () => {
		const { superAdmin } = models;

		const agent = await login(superAdmin);

		process.env.FORCE_BASE_PUBPUB = 'true';
		const result = await agent
			.get(`/user/${superAdmin.slug}`)
			.set('Host', 'www.pubpub.org')
			.send()
			.expect(200);

		/** Sort so that the id is at the end */
		const surrogateKeys = result.headers['surrogate-key']?.split(' ').sort();

		expect(surrogateKeys).toMatchObject(
			[
				fakeCommunityDomain,
				superAdmin.slug,
				`${testCommunitySubdomain}.pubpub.org`,
				`${connectionCommunitySubdomain}.pubpub.org`,
				'www.pubpub.org',
			].sort(),
		);
	});
});

describe('advanced purging tests', () => {
	beforeEach(async () => {
		await finishDeferredTasks();
		vi.clearAllMocks();
	});

	it(`when PUT /api/users is hit for the specified user, it purges the cache of
	- every community the user has Pub/Collectinattributions in
	- every community the user is a member
	- every community the user is a member of a Pub or Collection in 
	- the logged in user
	- the user pages belonging to the user
	`, async () => {
		const {
			superAdmin,
			connectionCommunity,
			community,
			fakeCommunity,
			collectionAttributionCommunity,
			communityMemberCommunity,
			pubMemberCommunity,
			collectionMemberCommunity,
			releaseTestCommunity,
		} = models;

		const agent = await login(superAdmin);

		setEnvironment(false, false, false);
		// we want to make sure that the purge calls in the previous tests aren't counted

		const unique = 'unique.com';
		await agent
			.put('/api/users')
			.send({
				userId: superAdmin.id,
				bio: 'This little manouveur is gonna cost us 51 years',
			})
			.set('Host', unique)
			.expect(201);

		await finishDeferredTasks();

		const purges = [
			getCorrectHostname(connectionCommunity.subdomain, connectionCommunity.domain),
			getCorrectHostname(community.subdomain, community.domain),
			getCorrectHostname(fakeCommunity.subdomain, fakeCommunity.domain),
			getCorrectHostname(
				collectionAttributionCommunity.subdomain,
				collectionAttributionCommunity.domain,
			),
			getCorrectHostname(communityMemberCommunity.subdomain, communityMemberCommunity.domain),
			getCorrectHostname(pubMemberCommunity.subdomain, pubMemberCommunity.domain),
			getCorrectHostname(
				collectionMemberCommunity.subdomain,
				collectionMemberCommunity.domain,
			),
			getCorrectHostname(releaseTestCommunity.subdomain, releaseTestCommunity.domain),
			superAdmin.slug,
			getPPLic(superAdmin),
			unique,
		];

		purges.forEach((key) => expectFastlyPurge({ key }));

		expect(global.fetch).toHaveBeenCalledTimes(purges.length);
	}, 20_000);

	it('purges the user pages cache when a user is added or removed from a Pub attribution', async () => {
		const { superAdmin, community } = models;

		const agent = await login(superAdmin);

		setEnvironment(true, false, false);
		const unique = 'unique.com';

		const { body } = await agent
			.post('/api/pubs')
			.send({
				communityId: community.id,
			})
			.set('Host', unique)
			.expect(201);

		await finishDeferredTasks();

		expectFastlyPurge({ key: superAdmin.slug });
		expectFastlyPurge({ key: unique });

		vi.clearAllMocks();

		const {
			body: { attributions },
		} = await agent
			.get(`/api/pubs/${body.id}?include[]=attributions`)
			.set('Host', getCorrectHostname(community.subdomain, community.domain))
			.expect(200);

		// remove attribution
		await agent
			.delete(`/api/pubAttributions`)
			.send({
				id: attributions[0].id,
				pubId: body.id,
				communityId: community.id,
			})
			.set('Host', unique)
			.expect(200);

		await finishDeferredTasks();

		expectFastlyPurge({ key: unique });

		expect(global.fetch).toHaveBeenCalledTimes(1);

		vi.clearAllMocks();

		// test if batch create works differently
		await agent
			.post('/api/pubAttributions/batch')
			.set('Host', unique)
			.send({
				pubId: body.id,
				communityId: community.id,
				attributions: [
					{
						userId: superAdmin.id,
						affiliation: 'batch',
						order: 0.5,
					},
				],
			})
			.expect(201);

		await finishDeferredTasks();

		expectFastlyPurge({ key: superAdmin.slug });
		expectFastlyPurge({ key: unique });
	});

	it('purges the user pages for PubAttributions whenever a Release is created', async () => {
		const { superAdmin, releaseTestCommunity, releaseTestPub } = models;

		const agent = await login(superAdmin);

		await agent
			.post('/api/releases')
			.set(
				'Host',
				getCorrectHostname(releaseTestCommunity.subdomain, releaseTestCommunity.domain),
			)
			.send({
				pubId: releaseTestPub.id,
			})
			.expect(201);

		await finishDeferredTasks();

		expectFastlyPurge({ key: superAdmin.slug });
		expectFastlyPurge({
			key: getCorrectHostname(releaseTestCommunity.subdomain, releaseTestCommunity.domain),
		});
	});

	it.todo('purges the pp-lic cookie tag when usernotification related apis are hit');

	it.todo('purges the pp-lic cookie tag a comment is made');
});
