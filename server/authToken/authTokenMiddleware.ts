import passport from 'passport';
import type { RequestHandler } from 'express';

export const authTokenMiddleware: RequestHandler = async (req, res, next) => {
	/** You are only allowed to access API routes with token */
	if (!req.path.includes('/api')) {
		return next();
	}

	/** Do not try to authenticate by token if user is already authenticated */
	if (req.user != null) {
		return next();
	}

	try {
		const authenticate = new Promise((resolve, reject) => {
			passport.authenticate('bearer', (authErr: Error, user: any) => {
				if (authErr) {
					return reject(authErr);
				}
				return resolve(user);
			})(req, res);
		});

		const user = await authenticate;
		req.user = user;

		return next();
	} catch (err) {
		return next(err);
	}
};
