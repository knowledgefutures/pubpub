import { Request, Response, NextFunction } from 'express';
import { defer } from 'server/utils/deferred';
import { sequelize } from 'server/models';
import { QueryTypes } from 'sequelize';
import type { createCachePurgeDebouncer } from './schedulePurge';
import { uniqueCommunitiesFromMembersQuery } from './uniqueCommunitiesFromMembersQuery';
import { getCorrectHostname } from './getCorrectHostname';
import { getPPLic } from './getHashedUserId';
import { shouldntPurge } from './skipPurgeConditions';

const ALLOWED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'] as const;
type AllowedMethods = (typeof ALLOWED_METHODS)[number];

/**
 * There are some routes that look like they change data, but they don't.
 */
const nonPurgeNonGetRoutes = {
	'/api/pubs/many': ['POST'],
	'/api/upload': ['POST'],
	'/api/pubs/text/convert': ['POST'],
	'/api/login': ['POST'],
	'/api/register': ['POST'],
	'/api/signup': ['POST'],
	'/api/subscribe': ['POST'],
	'/api/activityItems': ['POST'],
	/**
	 * Exports get purged in the export task
	 */
	'/api/export': ['POST'],
} satisfies {
	[Path in `/api/${string}`]: AllowedMethods[];
};

const userPaths = [
	'/api/userNotifications',
	'/api/threads/subscriptions',
	'/api/pubs/subscriptions',
	'/api/userNotificationPreferences',
	'/api/userDismissable',
] as const;

async function getUniqueHostnamesForUserId(userId: string) {
	const result = (await sequelize.query(uniqueCommunitiesFromMembersQuery, {
		replacements: { userId },
		type: QueryTypes.SELECT,
	})) as { domain: string | null; subdomain: string }[];

	const hostnames = result.map(({ domain, subdomain }) => getCorrectHostname(subdomain, domain));

	return hostnames;
}

/**
 * These are routes with path parameters that we don't want to purge
 * They aren't easily caught in the map above
 */
const otherNonPurgeRoutes = /\/api\/(pubs|collections)\/[^/]+\/doi\/preview/;

async function getSurrogateTag(req: Request) {
	/**
	 * We don't want to purge GET/CORS/HEAD etc requests, that's the whole point!
	 */
	if (!ALLOWED_METHODS.includes(req.method as AllowedMethods)) {
		return null;
	}

	/**
	 * Very strong fail safe, but don't purge cache on non-API requests
	 */
	if (!req.path.startsWith('/api')) {
		return null;
	}

	const shouldNotPurgeMethodsForPath = nonPurgeNonGetRoutes[req.path];

	if (shouldNotPurgeMethodsForPath && shouldNotPurgeMethodsForPath.includes(req.method)) {
		return null;
	}

	if (otherNonPurgeRoutes.test(req.path)) {
		return null;
	}

	/**
	 * these routes only affect the user who made the request
	 * and should affect the cache across communities
	 */
	if (userPaths.some((path) => path === req.path)) {
		return req.cookies['pp-lic'];
	}

	/**
	 * On Fastly, we set the surrogate tag to the hostname
	 */
	const surrogateTag = req.hostname;

	return surrogateTag;
}

/**
 * Purge domain cache on CRUD operations
 */
export const purgeMiddleware = (
	schedulePurge: ReturnType<typeof createCachePurgeDebouncer>['schedulePurge'],
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (shouldntPurge()) {
			return next();
		}

		const surrogateTag = await getSurrogateTag(req);

		if (!surrogateTag) {
			return next();
		}

		/**
		 * When the request finishes, schedule a purge
		 */
		res.on('finish', () => {
			/**
			 * We only now know the status code, so check if the request was actually successful
			 */
			if (res.statusCode >= 400) {
				return;
			}

			defer(async () => {
				if (req.path === '/api/users' && req.method === 'PUT') {
					const hostnames = await getUniqueHostnamesForUserId(req.user.id);

					const allPurges = [
						// all the communities the user is a member of,
						// either directly or through a pub/collection
						...hostnames,
						// the current community
						surrogateTag,
						// purge the cache for the logged in user
						getPPLic(req.user),
						// purge all the /user pages
						req.user.id,
					];

					await Promise.all(allPurges.map(async (tag) => schedulePurge(tag)));
				} else {
					/**
					 * this await is here so you can wait on the purge requests
					 * using `finishDeferredTasks` in tests or other short lived processes
					 */
					await schedulePurge(surrogateTag);
				}
			});
		});

		return next();
	};
};
