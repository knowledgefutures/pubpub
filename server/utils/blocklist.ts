import { RequestHandler } from 'express';

export const blocklistMiddleware: RequestHandler = async (req, res, next) => {
	/** You are only allowed to access API */
	const maybeBlockList = process.env.BLOCKLIST_IP_ADDRESSES?.split(',') || [];

	if (!maybeBlockList.length) {
		return next();
	}

	const xForwardedFor = req.headers['x-forwarded-for'];

	const ip = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor?.split(',')[0];

	if (!ip) {
		return next();
	}

	// eslint-disable-next-line no-restricted-syntax
	for (const blocklistIp of maybeBlockList) {
		if (ip.startsWith(blocklistIp)) {
			console.warn('Blocking IP', {
				ip,
				headers: req.headers,
				path: req.path,
				method: req.method,
				hostname: req.hostname,
			});
			return res.status(403).send('Forbidden');
		}
	}

	return next();
};
