import { clearUserToAgentMap } from './userToAgentMap';
import { sequelize } from '../server/models';

export const setup = (beforeFn, actionsFn) => {
	if (beforeFn.toString().startsWith('after')) {
		console.warn(
			'You are passing a function that looks like afterAll or afterEach into setup.' +
				'You probably want to use beforeAll or beforeEach instead.',
		);
	}
	beforeFn(async () => {
		sequelize.sync();
		if (actionsFn) {
			await actionsFn();
		}
	});
};

export const teardown = (afterFn, actionsFn) => {
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
	});
};
