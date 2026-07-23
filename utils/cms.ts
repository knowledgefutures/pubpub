/**
 * Auth and legal pages stay reachable on gated communities (spam-flagged or
 * CMS mode) so that members can sign in from the not-found page instead of
 * dead-ending on it.
 */
export const AUTH_BYPASS_PREFIXES = [
	'/login',
	'/logout',
	'/signup',
	'/password-reset',
	'/legal',
	'/privacy',
	'/tos',
];

const matchesPrefix = (path: string, prefixes: string[]) =>
	prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export const isAuthBypassPath = (path: string) => matchesPrefix(path, AUTH_BYPASS_PREFIXES);

/**
 * Paths that stay on PubPub even when a CMS-mode community hides itself from
 * the public: auth pages, the dashboard, and crawler files (robots.txt and
 * sitemaps stay readable so the disallow/noindex rules are served; those
 * routes handle CMS mode themselves).
 */
export const isCmsGateBypassPath = (path: string) =>
	path === '/robots.txt' ||
	/^\/sitemap[^/]*\.xml$/.test(path) ||
	isAuthBypassPath(path) ||
	matchesPrefix(path, ['/dash']);
