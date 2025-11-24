import type { beforeAll } from 'vitest';

import { vi } from 'vitest';

import { sequelize } from '../server/sequelize';
import { clearUserToAgentMap } from './userToAgentMap';

export const setup = (
	beforeFn: typeof beforeAll,
	actionsFn?: (() => any) | (() => Promise<any>),
) => {
	if (beforeFn.toString().startsWith('after')) {
		console.warn(
			'You are passing a function that looks like afterAll or afterEach into setup.' +
				'You probably want to use beforeAll or beforeEach instead.',
		);
	}
	beforeFn(async () => {
		if (actionsFn) {
			await sequelize.sync();
			await actionsFn();
		}
	}, 30000);
};

export const teardown = (
	afterFn: typeof beforeAll,
	actionsFn?: (() => any) | (() => Promise<any>),
) => {
	if (afterFn.toString().startsWith('before')) {
		console.warn(
			'You are passing a function that looks like beforeAll or beforeEach into teardown.' +
				'You probably want to use afterAll or afterEach instead.',
		);
	}
	afterFn(async () => {
		if (actionsFn) {
			await actionsFn();
		}
		vi.clearAllMocks();
		clearUserToAgentMap();
		await sequelize.close();
	});
};
