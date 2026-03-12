import type { NextFunction, Request, Response } from 'express';

type RateLimiterOptions = {
	maxRequests: number;
	windowMs: number;
};

// sliding window per-user rate limiter
export const createPerUserRateLimiter = (opts: RateLimiterOptions) => {
	const { maxRequests, windowMs } = opts;
	const windows = new Map<string, number[]>();

	const cleanup = () => {
		const now = Date.now();
		for (const [key, timestamps] of windows) {
			const filtered = timestamps.filter((t) => now - t < windowMs);
			if (filtered.length === 0) {
				windows.delete(key);
			} else {
				windows.set(key, filtered);
			}
		}
	};

	const cleanupInterval = setInterval(cleanup, windowMs * 2);
	cleanupInterval.unref();

	return (req: Request, res: Response, next: NextFunction) => {
		const userId = (req as any).user?.id;
		if (!userId) return next();

		const now = Date.now();
		const timestamps = windows.get(userId) ?? [];
		const recent = timestamps.filter((t) => now - t < windowMs);

		if (recent.length >= maxRequests) {
			return res.status(429).json({ error: 'Too many requests. Please try again later.' });
		}

		recent.push(now);
		windows.set(userId, recent);
		return next();
	};
};
