import { SpamTag } from 'server/models';
import { modelize, setup, teardown } from 'stubstub';

import { getSpamTagForUser, removeSpamTagFromUser, upsertSpamTag } from '../userQueries';

const models = modelize`
	User userA {}
	User userB {}
	User userC {}
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('upsertSpamTag', () => {
	it('creates a spam tag for a user that has none', async () => {
		const { userA } = models;
		const { spamTag } = await upsertSpamTag({ userId: userA.id });
		expect(spamTag).toBeTruthy();
		expect(spamTag.status).toBe('unreviewed');
		expect(spamTag.spamScore).toBeGreaterThanOrEqual(0);
	});

	it('returns the user alongside the spam tag', async () => {
		const { userA } = models;
		const { user } = await upsertSpamTag({ userId: userA.id });
		expect(user.id).toBe(userA.id);
	});

	it('merges fields when a spam tag already exists', async () => {
		const { userA } = models;
		await upsertSpamTag({ userId: userA.id, fields: { suspiciousFiles: ['/file-a.html'] } });
		await upsertSpamTag({ userId: userA.id, fields: { suspiciousFiles: ['/file-b.html'] } });
		const tag = await getSpamTagForUser(userA.id);
		expect(tag).toBeTruthy();
		expect(tag!.fields.suspiciousFiles).toEqual(
			expect.arrayContaining(['/file-a.html', '/file-b.html']),
		);
	});

	it('accumulates honeypot triggers', async () => {
		const { userB } = models;
		await upsertSpamTag({
			userId: userB.id,
			fields: {
				honeypotTriggers: [{ honeypot: 'create-community', value: 'bot-website.com' }],
			},
		});
		await upsertSpamTag({
			userId: userB.id,
			fields: {
				honeypotTriggers: [{ honeypot: 'create-pub', value: 'spam-description' }],
			},
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

	it('sets status in a single call', async () => {
		const { userA } = models;
		await upsertSpamTag({ userId: userA.id, status: 'confirmed-spam' });
		const tag = await getSpamTagForUser(userA.id);
		expect(tag!.status).toBe('confirmed-spam');
		expect(tag!.statusUpdatedAt).toBeTruthy();
	});

	it('creates a tag with status in one step for a new user', async () => {
		const { userC } = models;
		const { spamTag } = await upsertSpamTag({ userId: userC.id, status: 'confirmed-spam' });
		expect(spamTag.status).toBe('confirmed-spam');
		expect(spamTag.statusUpdatedAt).toBeTruthy();
	});
});

describe('getSpamTagForUser', () => {
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
		await removeSpamTagFromUser(models.userB.id);
	});
});
