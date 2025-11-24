import type { RequestHandler } from 'express';

type Wrap = <
	P = any,
	ResBody = any,
	ReqBody = any,
	ReqQuery = any,
	Locals extends Record<string, any> = Record<string, any>,
>(
	handler: RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>,
) => RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>;

// Wrapper for app.METHOD() handlers. Though we need this to properly catch errors in handlers that
// return a promise, i.e. those that use async/await, we should use it everywhere to be consistent.
export const wrap: Wrap =
	(routeHandlerFn) =>
	async (...args) => {
		const [_req, _res, next] = args;
		try {
			return await routeHandlerFn(...args);
		} catch (err) {
			return next(err);
		}
	};
