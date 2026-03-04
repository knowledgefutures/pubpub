import { getSpamTagForUser } from 'server/spamTag/userQueries';
import { modelize, setup, teardown } from 'stubstub';

import { handleHoneypotTriggered, isHoneypotFilled } from '../honeypot';

const models = modelize`
	User userA {}
	User userB {}
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('handleHoneypotTriggered', () => {
	it('does nothing if userId is null', async () => {
		await expect(
			handleHoneypotTriggered(null, 'create-community', 'spam'),
		).resolves.toBeUndefined();
	});

	it('creates a spam tag with confirmed-spam status and records the trigger', async () => {
		const { userA } = models;
		await handleHoneypotTriggered(userA.id, 'create-community', 'bot-website.com');
		const tag = await getSpamTagForUser(userA.id);
		expect(tag).toBeTruthy();
		expect(tag!.status).toBe('confirmed-spam');
		expect(tag!.fields.honeypotTriggers).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					honeypot: 'create-community',
					value: 'bot-website.com',
				}),
			]),
		);
	});

	it('appends a second trigger to an existing spam tag', async () => {
		const { userA } = models;
		await handleHoneypotTriggered(userA.id, 'create-pub', 'spammy-description');
		const tag = await getSpamTagForUser(userA.id);
		expect(tag!.fields.honeypotTriggers).toHaveLength(2);
	});
});

describe('isHoneypotFilled + handleHoneypotTriggered integration', () => {
	it('correctly identifies a filled honeypot and marks the user', async () => {
		const { userB } = models;
		const honeypotValue = 'i-am-a-bot';
		if (isHoneypotFilled({ _honeypot: honeypotValue })) {
			await handleHoneypotTriggered(userB.id, 'edit-user', honeypotValue);
		}
		const tag = await getSpamTagForUser(userB.id);
		expect(tag).toBeTruthy();
		expect(tag!.status).toBe('confirmed-spam');
	});
});
