import {
	PresenceAuthority,
	RedisPresenceBroadcastManager,
	RedisPresencePersistenceManager,
} from '@pitter-patter/presence-server';

import { env } from 'server/env';

let presenceAuthority: PresenceAuthority | null = null;

export const getPresenceAuthority = () => {
	if (!presenceAuthority) {
		throw new Error('[collab] Presence Redis not connected. Call connectPresenceRedis() first.');
	}
	return presenceAuthority;
};

export const connectPresenceRedis = async () => {
	const redisUrl = env.VALKEY_URL ?? 'redis://localhost:6379';
	const broadcaster = new RedisPresenceBroadcastManager({ redisUrl });
	const persister = new RedisPresencePersistenceManager({ redisUrl });
	await Promise.all([broadcaster.connect(), persister.connect()]);
	presenceAuthority = new PresenceAuthority({
		persistenceManager: persister,
		broadcastManager: broadcaster,
	});
	console.log('[collab] presence redis connected');
};
