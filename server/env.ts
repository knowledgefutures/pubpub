import { z } from 'zod';

import { type Env, envSchema } from './envSchema';

type EnvKey = keyof Env;
type RawEnvSnapshot = Partial<Record<EnvKey, string | undefined>>;

export type { Env } from './envSchema';

export { envSchema } from './envSchema';

function parseEnv() {
	try {
		return envSchema.parse(process.env);
	} catch (e) {
		if (e instanceof z.ZodError) {
			console.error('Invalid environment variables:');
			for (const issue of e.issues) {
				console.error(`  ${issue.path.join('.')}: ${issue.message}`);
			}
			throw new Error('Environment validation failed. See above for details.');
		}
		throw e;
	}
}

const envKeys = Object.keys(envSchema.shape) as EnvKey[];
const envKeySet = new Set<string>(envKeys);

let parsedEnvCache: Env | null = null;
let rawEnvSnapshot: RawEnvSnapshot | null = null;

const createRawSnapshot = (): RawEnvSnapshot => {
	return envKeys.reduce<RawEnvSnapshot>((acc, key) => {
		acc[key] = process.env[key];
		return acc;
	}, {});
};

const hasRawEnvChanged = (): boolean => {
	if (!rawEnvSnapshot) {
		return true;
	}

	return envKeys.some((key) => process.env[key] !== rawEnvSnapshot?.[key]);
};

const parseAndCacheEnv = (): Env => {
	const parsedEnv = parseEnv();
	parsedEnvCache = parsedEnv;
	rawEnvSnapshot = createRawSnapshot();
	return parsedEnv;
};

const getParsedEnv = (): Env => {
	if (!parsedEnvCache || hasRawEnvChanged()) {
		return parseAndCacheEnv();
	}

	return parsedEnvCache;
};

const setProcessEnvValue = <K extends EnvKey>(key: K, value: Env[K]) => {
	if (value === undefined || value === null) {
		delete process.env[key];
		return;
	}

	process.env[key] = String(value);
};

export const refreshEnv = () => parseAndCacheEnv();

export const setEnv = <K extends EnvKey>(key: K, value: Env[K]) => {
	setProcessEnvValue(key, value);
	parsedEnvCache = null;
	rawEnvSnapshot = null;
};

export const env: Env = new Proxy({} as Env, {
	get: (_, property) => {
		if (typeof property !== 'string' || !envKeySet.has(property)) {
			return undefined;
		}

		return getParsedEnv()[property as EnvKey];
	},
	set: (_, property, value) => {
		if (typeof property !== 'string' || !envKeySet.has(property)) {
			return false;
		}

		setEnv(property as EnvKey, value as Env[EnvKey]);
		return true;
	},
	has: (_, property) => {
		return typeof property === 'string' && envKeySet.has(property);
	},
	ownKeys: () => envKeys as string[],
	getOwnPropertyDescriptor: (_, property) => {
		if (typeof property !== 'string' || !envKeySet.has(property)) {
			return undefined;
		}

		return {
			enumerable: true,
			configurable: true,
			writable: true,
			value: getParsedEnv()[property as EnvKey],
		};
	},
});
