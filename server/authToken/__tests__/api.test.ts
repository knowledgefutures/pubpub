import { login, modelize, setup, teardown } from 'stubstub';

const models = modelize`
    Community community {
       Member {
            permissions: "admin"
            User communityAdmin {
				AuthToken adminToken {
					expiresAt: null
				}
				AuthToken expiredToken {
					expiresAt: "2021-01-01T00:00:00.000Z"
				}
            }
       }

       Member {
            permissions: "manage"
            User communityManager {
				AuthToken manageToken {
					expiresAt: null
				}
            }
       }

	   Member {
			permissions: "admin"
			User anotherAdmin {
				AuthToken anotherToken {
					expiresAt: null
				}
			}
	   }
    }

    Community anotherCommunity {
        Member {
            permissions: "admin"
            User anotherCommunityAdmin {
				AuthToken anotherAuthToken {
					expiresAt: null
				}
            }
        }
    }

	User superAdmin {
		isSuperAdmin: true
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

describe('authToken', () => {
	it('should be possible for an admin to create a token', async () => {
		const { community, communityAdmin } = models;

		const agent = await login(communityAdmin);

		await agent
			.post(`/api/authTokens`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.send({ expiresAt: 'never', communityId: community.id })
			.expect(201);
	});

	it('should be possible for an admin to use a token to access admin only routes', async () => {
		const { adminToken, community } = models;

		const agent = await login();
		const result = await agent
			.get('/api/members')
			.set('Authorization', `Bearer ${adminToken.token}`)
			.set('communityhostname', `${community.subdomain}.pubpub.org`)
			.expect(200);

		expect(result.body.length).toBeGreaterThan(0);
	});

	it('should not be possible for a non-admin to create a token', async () => {
		const { community, communityManager } = models;

		const agent = await login(communityManager);

		await agent
			.post(`/api/authTokens`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.send({ expiresAt: 'never', communityId: community.id })
			.expect(403);
	});

	it('should not be possible for a non-admin to use a token to access admin only routes', async () => {
		const { manageToken, community } = models;

		await (await login())
			.get('/api/members')
			.set('Authorization', `Bearer ${manageToken.token}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(403);
		//		await fetchWithToken(manageToken.token, community, `/api/members`, 403);
	});

	it('should not be possible to use a token for a different community', async () => {
		const { adminToken, anotherCommunity } = models;

		await (await login())
			.get('/api/members')
			.set('Authorization', `Bearer ${adminToken.token}`)
			.set('Host', `${anotherCommunity.subdomain}.pubpub.org`)
			.expect(403);
	});

	it('should throw an error for expired tokens', async () => {
		const { expiredToken, community } = models;

		await (await login())
			.get('/api/members')
			.set('Authorization', `Bearer ${expiredToken.token}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(403);
	});

	it("should not be possible for an admin to delete another community's admins token", async () => {
		const { adminToken, community, anotherAuthToken } = models;

		await (await login())
			.delete(`/api/authTokens/${anotherAuthToken.id}`)
			.set('Authorization', `Bearer ${adminToken.token}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(404);
	});

	it('a bearer token should not be able to list tokens for a different community', async () => {
		const { adminToken, community, anotherCommunity } = models;

		await (await login())
			.get(`/api/authTokens/community/${anotherCommunity.id}`)
			.set('Authorization', `Bearer ${adminToken.token}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(403);
	});

	it('a bearer token should not be able to revoke tokens for a different community', async () => {
		const { adminToken, community, anotherAuthToken, anotherCommunity } = models;

		await (await login())
			.delete(`/api/authTokens/community/${anotherCommunity.id}/${anotherAuthToken.id}`)
			.set('Authorization', `Bearer ${adminToken.token}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(403);
	});

	it('should be possible for an admin to delete a token', async () => {
		const { adminToken, community } = models;

		await (await login())
			.delete(`/api/authTokens/${adminToken.id}`)
			.set('Authorization', `Bearer ${adminToken.token}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.send()
			.expect(200);
	});

	it('users should always we able to remove their own tokens, even if they are not/no longer admins', async () => {
		const { communityManager, manageToken } = models;

		const agent = await login(communityManager);

		await agent
			.delete(`/api/authTokens/${manageToken.id}`)
			.set('Host', `${communityManager.subdomain}.pubpub.org`)
			.expect(200);
	});

	it('admins should not be able to remove tokens from other users', async () => {
		const { communityAdmin, community, anotherToken } = models;

		const agent = await login(communityAdmin);

		await agent
			.delete(`/api/authTokens/${anotherToken.id}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			// 404 is thrown because token lookup is by id and user id
			.expect(404);
	});

	it('superadmins should be able to revoke any token', async () => {
		const { superAdmin, expiredToken } = models;

		const agent = await login(superAdmin);

		await agent.delete(`/api/authTokens`).send({ token: expiredToken.token }).expect(200);
	});

	it('a user should be able to list their own tokens, without the token secret', async () => {
		const { communityAdmin, community } = models;

		const agent = await login(communityAdmin);

		const result = await agent
			.get('/api/authTokens')
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(200);

		expect(Array.isArray(result.body)).toBe(true);
		result.body.forEach((t: any) => {
			expect(t.userId).toBe(communityAdmin.id);
			expect(t.token).toBeUndefined();
		});
	});

	it('a community admin should be able to list tokens scoped to that community', async () => {
		const { communityAdmin, community } = models;

		const agent = await login(communityAdmin);

		const result = await agent
			.get(`/api/authTokens/community/${community.id}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(200);

		expect(Array.isArray(result.body)).toBe(true);
		result.body.forEach((t: any) => {
			expect(t.communityId).toBe(community.id);
			expect(t.token).toBeUndefined();
		});
	});

	it('a non-admin should not be able to list tokens for a community', async () => {
		const { communityManager, community } = models;

		const agent = await login(communityManager);

		await agent
			.get(`/api/authTokens/community/${community.id}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(403);
	});

	it('a community admin should be able to revoke another admin’s token for that community', async () => {
		const { communityAdmin, community, anotherToken } = models;

		const agent = await login(communityAdmin);

		await agent
			.delete(`/api/authTokens/community/${community.id}/${anotherToken.id}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(200);
	});

	it('a community admin should not be able to revoke tokens for a different community', async () => {
		const { communityAdmin, community, anotherAuthToken, anotherCommunity } = models;

		const agent = await login(communityAdmin);

		await agent
			.delete(`/api/authTokens/community/${anotherCommunity.id}/${anotherAuthToken.id}`)
			.set('Host', `${community.subdomain}.pubpub.org`)
			.expect(403);
	});
});
