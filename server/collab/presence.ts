import {
	PresenceAuthority,
	RedisPresenceBroadcastManager,
	RedisPresencePersistenceManager,
} from '@pitter-patter/presence-server';

import { env } from 'server/env';

const redisUrl = env.VALKEY_URL ?? 'redis://localhost:6379';

const presenceBroadcaster = new RedisPresenceBroadcastManager({ redisUrl });
const presencePersister = new RedisPresencePersistenceManager({ redisUrl });

export const presenceAuthority = new PresenceAuthority({
	persistenceManager: presencePersister,
	broadcastManager: presenceBroadcaster,
});

export const connectPresenceRedis = async () => {
	await Promise.all([presenceBroadcaster.connect(), presencePersister.connect()]);
	console.log('[collab] presence redis connected');
};
