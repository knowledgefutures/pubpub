import type { KfSession } from '@knowledgefutures/sdk/middleware/express';

import type { UserWithPrivateFields } from './user';

export {};

declare global {
	namespace Express {
		export interface Request {
			user?: UserWithPrivateFields;

			kfUser?: KfSession['user'];
			kfSession?: KfSession['session'];
			kfJwtPayload?: Record<string, unknown>;
		}
	}
}
