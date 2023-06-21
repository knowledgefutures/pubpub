import type { Global } from '@jest/types';
import { clearUserToAgentMap } from './userToAgentMap';
import { sequelize } from '../server/sequelize';

export const setup = (
	beforeFn: Global.HookBase,
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
	afterFn: Global.HookBase,
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
		clearUserToAgentMap();
		await sequelize.close();
		// global.gc?.();
	});
};
