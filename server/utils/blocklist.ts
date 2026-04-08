import type { RequestHandler } from 'express';

const blockList = process.env.BLOCKLIST_IP_ADDRESSES?.split(',') ?? [];

export const blocklistMiddleware: RequestHandler = async (req, res, next) => {
	if (!blockList.length) {
		return next();
	}

	const xForwardedFor = req.headers['x-forwarded-for'];

	const ip = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor?.split(',')[0];

	if (!ip) {
		return next();
	}

	for (const blocklistIp of blockList) {
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
