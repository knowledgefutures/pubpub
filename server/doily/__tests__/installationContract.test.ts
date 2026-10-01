import { describe, expect, it } from 'vitest';

import { type DoilyInstallation, installationTargetId } from '../client';

/**
 * The cross-repo half of Doily's organization→project rename.
 *
 * Doily renamed the record that owns the deposits from `organization` to
 * `project` and emits both keys for one release. These tests pin PubPub's side of
 * that agreement so neither repo has to deploy first: PubPub reads whichever key
 * is present, which means it works against a Doily on either side of the rename
 * and Doily can retire the alias without waiting on us.
 *
 * The failure this guards is silent. If PubPub read only the retired key, then
 * the day Doily drops it every deposit would resolve to `undefined` and either
 * 400 or, worse, provision a fresh duplicate — which is the exact fork the
 * installation record was introduced to prevent.
 */

const installation = (over: Partial<DoilyInstallation>): DoilyInstallation => ({
	id: 'inst_1',
	appId: 'app_pubpub',
	externalId: 'community-uuid',
	...over,
});

describe('installationTargetId', () => {
	it('reads projectId, the current name', () => {
		expect(installationTargetId(installation({ projectId: 'prj_1' }))).toBe('prj_1');
	});

	it('reads organizationId, the retired name', () => {
		// A Doily that has not taken the rename yet.
		expect(installationTargetId(installation({ organizationId: 'org_1' }))).toBe('org_1');
	});

	it('prefers projectId when both are present', () => {
		// The dual-key release sends both, and the new key is authoritative.
		expect(
			installationTargetId(installation({ projectId: 'prj_1', organizationId: 'prj_1' })),
		).toBe('prj_1');
	});

	it('throws rather than returning undefined when neither is present', () => {
		// Loudly, because the alternative is provisioning a duplicate project for a
		// community that already has one.
		expect(() => installationTargetId(installation({}))).toThrow(/neither projectId nor/);
	});
});
