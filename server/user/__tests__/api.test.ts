import { User } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

const tonyEmail = `${crypto.randomUUID()}@gmail.com`;

const models = modelize`
    User user {}
    Signup signup {
        email: ${tonyEmail}
        hash: "hash"
        completed: false
        count: 1
    }
	User suggestionUser {}
`;

setup(beforeAll, models.resolve);
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
