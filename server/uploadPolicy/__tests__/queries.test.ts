import { vi } from 'vitest';

vi.mock('server/env', () => ({
	env: { AWS_ACCESS_KEY_ID: 'test-id', AWS_SECRET_ACCESS_KEY: 'test-secret' },
}));

import { getUploadPolicy } from '../queries';

const getConditions = (policy: string) =>
	JSON.parse(Buffer.from(policy, 'base64').toString('utf8')).conditions as unknown[];

const attachment = ['starts-with', '$Content-Disposition', 'attachment'];

describe('getUploadPolicy', () => {
	it('signs an exact key and content type', () => {
		const { policy } = getUploadPolicy({ contentType: 'image/png', key: 'c1/u2/a-1.png' });
		const conditions = getConditions(policy);
		expect(conditions).toContainEqual({ key: 'c1/u2/a-1.png' });
		expect(conditions).toContainEqual(['eq', '$Content-Type', 'image/png']);
		expect(conditions).not.toContainEqual(attachment);
	});

	it.each([
		'text/html',
		'image/svg+xml',
		'text/plain',
		'application/octet-stream',
	])('requires an attachment for %s', (contentType) => {
		const { policy } = getUploadPolicy({ contentType, key: 'c1/u2/a-1.x' });
		expect(getConditions(policy)).toContainEqual(attachment);
	});

	it.each([
		'image/jpeg',
		'video/mp4',
		'audio/mpeg',
		'application/pdf',
	])('allows %s inline', (contentType) => {
		const { policy } = getUploadPolicy({ contentType, key: 'c1/u2/a-1.x' });
		expect(getConditions(policy)).not.toContainEqual(attachment);
	});
});
