/* eslint-disable no-undef */
// @ts-check
/* global beforeAll, afterAll */
import sinon, { SinonStub } from 'sinon';

import { getEmptyDoc } from 'components/Editor';
import * as firebaseAdmin from '../server/utils/firebaseAdmin';

const stubManyFunctions = <T extends Record<string, any>>(
	module: T,
	stubEntries: [keyof T, any | null][],
) =>
	Object.fromEntries(
		stubEntries.map(([key, value]) => {
			const stub = sinon.stub(module, key);
			if (value) {
				stub.callsFake(value);
			}
			return [key, stub];
		}),
	);

type Functions<T extends Record<string, any> = Record<string, any>> = T | keyof T | (keyof T)[];

const getStubEntries = <T extends Record<string, any>>(functions: Functions<T>) => {
	if (typeof functions === 'string') {
		return [[functions, null]] as [[keyof T, null]];
	}

	if (Array.isArray(functions)) {
		return functions.map((fn) => [fn, null] as [keyof Record<string, any>, null]);
	}

	return Object.entries(functions) as T extends Record<string, any>
		? [keyof T, T[keyof T]][]
		: never;
};

export const stubModule = <T extends Record<string, any> | string>(
	module: T,
	functions: T extends Record<string, any> ? Functions<T> : Functions,
) => {
	if (typeof module === 'string') {
		// lol,
		// eslint-disable-next-line
		module = require(module);
	}
	const stubEntries = getStubEntries(functions);
	const stubs = stubManyFunctions(module as Record<string, any>, stubEntries);
	return {
		stubs,
		restore: () => Object.values(stubs).forEach((stub) => stub.restore()),
	};
};

export const stubOut = (
	module: Record<string, any> | string,
	functions: Functions,
	before = beforeAll,
	after = afterAll,
) => {
	let restore: (() => void) | undefined;
	before(() => {
		restore = stubModule(module, functions).restore;
	});
	after(() => {
		if (restore) {
			restore();
		}
	});
};

export const stubFirebaseAdmin = () => {
	let stubs: SinonStub[];

	beforeAll(() => {
		const getPubDraftDocStub = sinon.stub(firebaseAdmin, 'getPubDraftDoc').returns(
			Promise.resolve({
				doc: getEmptyDoc(),
				mostRecentRemoteKey: 0,
				historyData: {
					timestamps: {},
					currentKey: 0,
					latestKey: 0,
				},
				firstTimestamp: 0,
				latestTimestamp: 0,
			}),
		);
		const getFirebaseTokenStub = sinon
			.stub(firebaseAdmin, 'getFirebaseToken')
			.returns(Promise.resolve(''));
		stubs = [getPubDraftDocStub, getFirebaseTokenStub];
	});

	afterAll(() => stubs.forEach((stub) => stub.restore()));
};
