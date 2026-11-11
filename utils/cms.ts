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

/**
 * Should this request be turned away from a CMS-mode community?
 *
 * `canView` comes from `scopeData.activePermissions` and is the definition of
 * an insider: getScope raises it only for members of the community, collection
 * or pub, for superadmins, and for holders of an access hash matching
 * something in the request's own URL. Public permissions do not raise it, and
 * neither does a pub being released, so the community stays invisible to the
 * public while sharing links keep working.
 */
export const isCmsGated = ({
	cmsMode,
	path,
	canView,
}: {
	cmsMode: boolean | null | undefined;
	path: string;
	canView: boolean;
}) => Boolean(cmsMode) && !isCmsGateBypassPath(path) && !canView;
