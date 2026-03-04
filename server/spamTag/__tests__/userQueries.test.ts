import { SpamTag } from 'server/models';
import { modelize, setup, teardown } from 'stubstub';

import {
	addSpamTagToUser,
	getSpamTagForUser,
	removeSpamTagFromUser,
	updateSpamTagForUser,
} from '../userQueries';

const models = modelize`
	User userA {}
	User userB {}
	User userC {}
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('addSpamTagToUser', () => {
	it('creates a spam tag for a user that has none', async () => {
		const { userA } = models;
		const tag = await addSpamTagToUser(userA.id);
		expect(tag).toBeTruthy();
		expect(tag.status).toBe('unreviewed');
		expect(tag.spamScore).toBeGreaterThanOrEqual(0);
	});

	it('merges fields when a spam tag already exists', async () => {
		const { userA } = models;
		await addSpamTagToUser(userA.id, { suspiciousFiles: ['/file-a.html'] });
		await addSpamTagToUser(userA.id, { suspiciousFiles: ['/file-b.html'] });
		const tag = await getSpamTagForUser(userA.id);
		expect(tag).toBeTruthy();
		expect(tag!.fields.suspiciousFiles).toEqual(
			expect.arrayContaining(['/file-a.html', '/file-b.html']),
		);
	});

	it('accumulates honeypot triggers', async () => {
		const { userB } = models;
		await addSpamTagToUser(userB.id, {
			honeypotTriggers: [{ honeypot: 'create-community', value: 'bot-website.com' }],
		});
		await addSpamTagToUser(userB.id, {
			honeypotTriggers: [{ honeypot: 'create-pub', value: 'spam-description' }],
		});
		const tag = await getSpamTagForUser(userB.id);
		expect(tag!.fields.honeypotTriggers).toHaveLength(2);
		expect(tag!.fields.honeypotTriggers).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ honeypot: 'create-community' }),
				expect.objectContaining({ honeypot: 'create-pub' }),
			]),
		);
	});
});

describe('updateSpamTagForUser', () => {
	it('updates the status of an existing spam tag', async () => {
		const { userA } = models;
		await updateSpamTagForUser({ userId: userA.id, status: 'confirmed-spam' });
		const tag = await getSpamTagForUser(userA.id);
		expect(tag!.status).toBe('confirmed-spam');
		expect(tag!.statusUpdatedAt).toBeTruthy();
	});

	it('throws when the user has no spam tag', async () => {
		const { userC } = models;
		await expect(
			updateSpamTagForUser({ userId: userC.id, status: 'confirmed-spam' }),
		).rejects.toThrow('User is missing a SpamTag');
	});
});

describe('getSpamTagForUser', () => {
	it('returns null for a user with no spam tag', async () => {
		const { userC } = models;
		const tag = await getSpamTagForUser(userC.id);
		expect(tag).toBeNull();
	});

	it('returns the spam tag for a user that has one', async () => {
		const { userA } = models;
		const tag = await getSpamTagForUser(userA.id);
		expect(tag).toBeTruthy();
		expect(tag!.id).toBeTruthy();
	});
});

describe('removeSpamTagFromUser', () => {
	it('removes the spam tag from a user', async () => {
		const { userB } = models;
		const tagBefore = await getSpamTagForUser(userB.id);
		expect(tagBefore).toBeTruthy();
		await removeSpamTagFromUser(userB.id);
		const tagAfter = await getSpamTagForUser(userB.id);
		expect(tagAfter).toBeNull();
		const dbTag = await SpamTag.findByPk(tagBefore!.id);
		expect(dbTag).toBeNull();
	});

	it('does nothing if the user has no spam tag', async () => {
		const { userC } = models;
		await expect(removeSpamTagFromUser(userC.id)).resolves.toBeUndefined();
	});
});
