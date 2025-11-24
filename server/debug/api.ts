// Add this to your Express app for pool monitoring
// You can add this to your server/routes/ or wherever you define routes

import { type Request, type Response, Router } from 'express';

import { poolOptions, sequelize } from '../sequelize';

export const router = Router(); // adjust path as needed

export const poolStatsHandler = (req: Request, res: Response) => {
	if (process.env.NODE_ENV === 'production') {
		return res.status(404).json({ error: 'Not available in production' });
	}

	try {
		const readPool = sequelize.connectionManager.pool.read;
		const writePool = sequelize.connectionManager.pool.write;

		return res.json({
			timestamp: new Date().toISOString(),
			read: {
				size: readPool.size,
				available: readPool.available,
				using: readPool.using,
				waiting: readPool.waiting,
			},
			write: {
				size: writePool.size,
				available: writePool.available,
				using: writePool.using,
				waiting: writePool.waiting,
			},
			config: poolOptions,
		});
	} catch (error) {
		console.error('Error getting pool stats:', error);
		return res.status(500).json({ error: 'Failed to get pool stats' });
	}
};

router.get('/api/debug/pool-stats', poolStatsHandler);
