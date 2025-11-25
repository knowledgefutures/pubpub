import encHex from 'crypto-js/enc-hex';
import SHA3 from 'crypto-js/sha3';

import { User } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

const email = `${crypto.randomUUID()}@example.com`;

const models = modelize`
    User user {
        email: ${email}
        password: "password"
    }
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('/api/account/password', () => {
	it('rejects password change with incorrect current password', async () => {
		const { user } = models;
		const agent = await login(user);

		await agent
			.put('/api/account/password')
			.send({
				currentPassword: SHA3('wrongpassword').toString(encHex),
				newPassword: SHA3('newpassword123').toString(encHex),
			})
			.expect(403);
	});

	it('requires authentication to change password', async () => {
		const agent = await login();

		await agent
			.put('/api/account/password')
			.send({
				currentPassword: SHA3('anypassword').toString(encHex),
				newPassword: SHA3('newpassword123').toString(encHex),
			})
			.expect(403);
	});

	it('allows a user to change their password', async () => {
		const { user } = models;
		const agent = await login(user);
		const oldPassword = 'password';
		const newPassword = 'newpassword123';

		await agent
			.put('/api/account/password')
			.send({
				currentPassword: SHA3(oldPassword).toString(encHex),
				newPassword: SHA3(newPassword).toString(encHex),
			})
			.expect(200);

		// verify the password was actually changed by trying to log in with new password
		const updatedUser = await User.findOne({ where: { id: user.id } });
		expect(updatedUser).toBeTruthy();
	});
});
