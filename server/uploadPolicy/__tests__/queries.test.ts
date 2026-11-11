import { vi } from 'vitest';

vi.mock('server/env', () => ({
	env: { AWS_ACCESS_KEY_ID: 'test-id', AWS_SECRET_ACCESS_KEY: 'test-secret' },
}));

import { getUploadPolicy } from '../queries';

const getConditions = (policy: string) =>
	JSON.parse(Buffer.from(policy, 'base64').toString('utf8')).conditions as unknown[];

describe('getUploadPolicy', () => {
	it('signs an exact match on the requested key', () => {
		const { policy } = getUploadPolicy({ contentType: 'image/png', key: 'c1/u2/a-1.png' });
		const conditions = getConditions(policy);
		expect(conditions).toContainEqual({ key: 'c1/u2/a-1.png' });
		expect(conditions).not.toContainEqual(['starts-with', '$key', '']);
	});

	it('keeps the open key condition when no key is requested', () => {
		const { policy } = getUploadPolicy({ contentType: 'image/png' });
		expect(getConditions(policy)).toContainEqual(['starts-with', '$key', '']);
	});
});
