import { setup, login, modelize } from 'stubstub';

import { User } from 'server/models';

const models = modelize`
    User user {}
    Signup signup {
        email: "tonywalnuts@gmail.com"
        hash: "hash"
        completed: false
        count: 1
    }
`;

setup(beforeAll, models.resolve);

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
		expect(createdUser.isSuperAdmin).toEqual(false);
	});

	it('does not allow existing users to make themselves a superadmin', async () => {
		const { user } = models;
		const agent = await login(user);
		await agent.put('/api/users').send({ userId: user.id, isSuperAdmin: true }).expect(201);
		const userNow = await User.findOne({ where: { id: user.id } });
		expect(userNow.isSuperAdmin).toEqual(false);
	});
});
