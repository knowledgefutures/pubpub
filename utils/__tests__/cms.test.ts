import { describe, expect, it } from 'vitest';

import {
	canonicalCollectionUrl,
	canonicalCommunityUrl,
	canonicalPubUrl,
} from 'utils/canonicalUrls';
import { isAuthBypassPath, isCmsGateBypassPath } from 'utils/cms';

const plainCommunity = { subdomain: 'demo', domain: null } as any;
const cmsCommunity = {
	subdomain: 'demo',
	domain: null,
	cmsMode: true,
	canonicalBaseUrl: 'https://journal.example.org/',
} as any;
const templatedCommunity = {
	...cmsCommunity,
	canonicalPubUrlTemplate: 'https://journal.example.org/articles/{slug}',
} as any;

describe('canonicalCommunityUrl', () => {
	it('falls back to the pubpub community url', () => {
		expect(canonicalCommunityUrl(plainCommunity)).toEqual('https://demo.pubpub.org');
	});
	it('uses canonicalBaseUrl without a trailing slash', () => {
		expect(canonicalCommunityUrl(cmsCommunity)).toEqual('https://journal.example.org');
	});
});

describe('canonicalCollectionUrl', () => {
	it('builds collection urls on the canonical base', () => {
		expect(canonicalCollectionUrl(cmsCommunity, { slug: 'issue-1' })).toEqual(
			'https://journal.example.org/issue-1',
		);
	});
});

describe('canonicalPubUrl', () => {
	it('falls back to the pubpub pub url', () => {
		expect(canonicalPubUrl(plainCommunity, { slug: 'my-pub' })).toEqual(
			'https://demo.pubpub.org/pub/my-pub',
		);
	});
	it('uses canonicalBaseUrl when set', () => {
		expect(canonicalPubUrl(cmsCommunity, { slug: 'my-pub' })).toEqual(
			'https://journal.example.org/pub/my-pub',
		);
	});
	it('prefers canonicalPubUrlTemplate', () => {
		expect(canonicalPubUrl(templatedCommunity, { slug: 'my-pub' })).toEqual(
			'https://journal.example.org/articles/my-pub',
		);
	});
});

describe('isAuthBypassPath', () => {
	it('matches auth and legal pages', () => {
		expect(isAuthBypassPath('/login')).toBe(true);
		expect(isAuthBypassPath('/signup')).toBe(true);
		expect(isAuthBypassPath('/password-reset/abc/def')).toBe(true);
		expect(isAuthBypassPath('/legal/terms')).toBe(true);
	});
	it('does not match the dashboard or content paths', () => {
		expect(isAuthBypassPath('/dash')).toBe(false);
		expect(isAuthBypassPath('/')).toBe(false);
		expect(isAuthBypassPath('/pub/my-pub')).toBe(false);
		expect(isAuthBypassPath('/loginish')).toBe(false);
	});
});

describe('isCmsGateBypassPath', () => {
	it('bypasses admin and auth pages', () => {
		expect(isCmsGateBypassPath('/dash')).toBe(true);
		expect(isCmsGateBypassPath('/dash/settings')).toBe(true);
		expect(isCmsGateBypassPath('/login')).toBe(true);
		expect(isCmsGateBypassPath('/signup')).toBe(true);
		expect(isCmsGateBypassPath('/password-reset/abc/def')).toBe(true);
		expect(isCmsGateBypassPath('/legal/terms')).toBe(true);
	});
	it('bypasses robots and sitemaps so crawler rules stay readable', () => {
		expect(isCmsGateBypassPath('/robots.txt')).toBe(true);
		expect(isCmsGateBypassPath('/sitemap.xml')).toBe(true);
		expect(isCmsGateBypassPath('/sitemap-index.xml')).toBe(true);
	});
	it('does not bypass content paths', () => {
		expect(isCmsGateBypassPath('/')).toBe(false);
		expect(isCmsGateBypassPath('/pub/my-pub')).toBe(false);
		expect(isCmsGateBypassPath('/dashing-page')).toBe(false);
		expect(isCmsGateBypassPath('/loginish')).toBe(false);
	});
});
