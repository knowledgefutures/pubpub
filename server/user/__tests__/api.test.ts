import { vitest } from 'vitest';

import { User } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

const tonyEmail = `${crypto.randomUUID()}@gmail.com`;
const autofillEmail = `${crypto.randomUUID()}@gmail.com`;
const restrictedEmail = `${crypto.randomUUID()}@gmail.com`;
const delayedHoneypotEmail = `${crypto.randomUUID()}@gmail.com`;
const spamEmail = `${crypto.randomUUID()}@gmail.com`;

const models = modelize`
    User user {}
    Signup signup {
        email: ${tonyEmail}
        hash: "hash"
        completed: false
        count: 1
    }
	Signup autofillSignup {
		email: ${autofillEmail}
		hash: "hash-autofill"
		completed: false
		count: 1
	}
	Signup restrictedSignup {
		email: ${restrictedEmail}
		hash: "hash-restricted"
		completed: false
		count: 1
	}
	Signup delayedHoneypotSignup {
		email: ${delayedHoneypotEmail}
		hash: "hash-delayed-honeypot"
		completed: false
		count: 1
	}
	Signup spamSignup {
		email: ${spamEmail}
		hash: "hash-spam"
		completed: false
		count: 1
	}
	User suggestionUser {}
`;

const { deleteSessionsForUser } = vitest.hoisted(() => {
	return {
		deleteSessionsForUser: vitest.fn().mockResolvedValue(undefined),
	};
});

vitest.mock(import('server/utils/session'), async (importOriginal) => {
	const og = await importOriginal();
	return {
		...og,
		deleteSessionsForUser: deleteSessionsForUser,
	};
});
vitest.mock(import('server/spamTag/notifications'), async (importOriginal) => {
	const og = await importOriginal();
	return {
		...og,
		notify: vitest.fn().mockResolvedValue(undefined),
	};
});

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

describe('/api/users', () => {
	it('does not allow a user to register as a superadmin', async () => {
		const { email, hash } = models.signup;
		const agent = await login();
		await agent
			.post('/api/users')
			.send({
				email,
				hash,
				firstName: 'Tony',
				lastName: 'Walnuts',
				password: 'oh!',
				isSuperAdmin: true,
			})
			.expect(201);
		const createdUser = await User.findOne({ where: { email } });
		expect(createdUser?.isSuperAdmin).toEqual(false);
	});

	it('does not allow existing users to make themselves a superadmin', async () => {
		const { user } = models;
		const agent = await login(user);
		await agent.put('/api/users').send({ userId: user.id, isSuperAdmin: true }).expect(201);
		const userNow = await User.findOne({ where: { id: user.id } });
		expect(userNow?.isSuperAdmin).toEqual(false);
	});

	it('immediately restricts users when website honeypot is filled', async () => {
		const { spamSignup } = models;
		const agent = await login();
		await agent
			.post('/api/users')
			.send({
				email: spamSignup.email,
				hash: spamSignup.hash,
				firstName: 'Slow',
				lastName: 'Fill',
				password: 'oh!',
				_honeypot: 'oh!',
				_formStartedAtMs: Date.now() - 6000,
			})
			.expect(403);
		const createdUser = await User.findOne({ where: { email: spamSignup.email } });
		expect(createdUser).toBeDefined();
		const { getSpamTagForUser } = await import('server/spamTag/userQueries');
		const spamTag = await getSpamTagForUser(createdUser!.id);
		expect(spamTag?.status).toBe('confirmed-spam');
		await agent
			.post('/api/login')
			.send({ email: createdUser!.email, password: 'oh!' })
			.expect(403);
	});

	it('does not restrict users when honeypot is filled after 5 seconds', async () => {
		const { delayedHoneypotSignup } = models;
		const agent = await login();
		await agent
			.post('/api/users')
			.send({
				email: delayedHoneypotSignup.email,
				hash: delayedHoneypotSignup.hash,
				firstName: 'Slow',
				lastName: 'Fill',
				password: 'oh!',
				_passwordHoneypot: 'oh!',
				_formStartedAtMs: Date.now() - 6000,
			})
			.expect(201);
		const createdUser = await User.findOne({ where: { email: delayedHoneypotSignup.email } });
		if (!createdUser) {
			throw new Error('Expected user to be created');
		}
		const { getSpamTagForUser } = await import('server/spamTag/userQueries');
		const spamTag = await getSpamTagForUser(createdUser.id);
		expect(spamTag).toBeNull();
		await agent
			.put('/api/users')
			.send({ userId: createdUser.id, firstName: 'Still', lastName: 'Allowed' })
			.expect(201);
	});

	it('restricts and does not authenticate users when password honeypot is filled within 5 seconds', async () => {
		const { restrictedSignup } = models;
		const agent = await login();
		await agent
			.post('/api/users')
			.send({
				email: restrictedSignup.email,
				hash: restrictedSignup.hash,
				firstName: 'Bot',
				lastName: 'Account',
				password: 'oh!',
				_passwordHoneypot: 'oh!',
				_formStartedAtMs: Date.now(),
			})
			.expect(403);
		const createdUser = await User.findOne({ where: { email: restrictedSignup.email } });
		expect(createdUser).toBeDefined();
		const { getSpamTagForUser } = await import('server/spamTag/userQueries');
		const spamTag = await getSpamTagForUser(createdUser!.id);
		expect(spamTag?.status).toEqual('confirmed-spam');

		expect(deleteSessionsForUser).toHaveBeenCalledWith(createdUser!.email);
	});

	it('allows an exisiting user to read another users profile info', async () => {
		const { user, suggestionUser } = models;
		const agent = await login(user);
		const res = await agent.get(`/api/users/${suggestionUser.id}`);
		const suggestedUserInfo = res.body;
		expect(suggestedUserInfo).toEqual({
			fullName: suggestionUser.fullName,
			initials: suggestionUser.initials,
			avatar: suggestionUser.avatar,
		});
	});

	it('returns 400 for /api/users/:id if its not a valid uuid', async () => {
		const { user } = models;
		const agent = await login(user);
		await Promise.all([
			agent.get('/api/users/not-a-uuid').expect(400),
			agent.get('/api/users/null').expect(400),
		]);
	});
});
