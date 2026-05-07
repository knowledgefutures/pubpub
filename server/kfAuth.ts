import type { KfSession } from '@knowledgefutures/sdk/middleware/express';
import type { KfServerSdk } from '@knowledgefutures/sdk/server';

import { createKfServerSdk } from '@knowledgefutures/sdk/server';

import { env } from 'server/env';

declare global {
	namespace Express {
		interface Request {
			kfUser?: KfSession['user'];
			kfSession?: KfSession['session'];
			kfJwtPayload?: Record<string, unknown>;
		}
	}
}

export interface SessionMiddlewareOptions {
	/** the kf-auth server URL, e.g. "http://localhost:3000" */
	authUrl: string;
}

let instance: KfServerSdk | null = null;

export function getKfSdk(): KfServerSdk {
	if (!instance) {
		const url = env.KF_AUTH_URL;

		if (!url) {
			throw new Error('KF_AUTH_URL is not configured');
		}

		instance = createKfServerSdk({ serverUrl: url });
	}

	return instance;
}

export function resetKfSdk() {
	instance = null;
}
