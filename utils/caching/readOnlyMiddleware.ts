import type { NextFunction, Request, Response } from 'express';

const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'] as const;
type MutatingMethod = (typeof MUTATING_METHODS)[number];

/** routes that use mutating methods but don't actually write to our database */
const allowedMutatingRoutes: Record<string, MutatingMethod[]> = {
	'/api/login': ['POST'],
	'/api/pubs/many': ['POST'],
	'/api/activityItems': ['POST'],
	'/api/analytics/track': ['POST'],
	'/api/subscribe': ['POST'],
};

function isMutatingRequest(req: Request): boolean {
	return MUTATING_METHODS.includes(req.method as MutatingMethod);
}

function isAllowedRoute(req: Request): boolean {
	const methods = allowedMutatingRoutes[req.path];
	return !!methods && methods.includes(req.method as MutatingMethod);
}

export const readOnlyMiddleware = () => {
	return (req: Request, res: Response, next: NextFunction) => {
		const isReadOnly = process.env.PUBPUB_READ_ONLY === 'true';

		if (!isReadOnly) {
			return next();
		}

		if (!req.path.startsWith('/api')) {
			return next();
		}

		if (!isMutatingRequest(req)) {
			return next();
		}

		if (isAllowedRoute(req)) {
			return next();
		}

		return res.status(423).json({
			error: 'readOnly',
			message:
				'PubPub is in read-only mode for scheduled maintenance. Please try again shortly.',
		});
	};
};
