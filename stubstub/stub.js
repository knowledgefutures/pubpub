/* global beforeAll, afterAll */
import sinon from 'sinon';

import { getEmptyDoc } from 'components/Editor';
import * as firebaseAdmin from '../server/utils/firebaseAdmin';

export const stubModule = (module, functionNames) => {
	if (!Array.isArray(functionNames)) {
		// eslint-disable-next-line no-param-reassign
		functionNames = [functionNames];
	}
	const stubsArr = [];
	const stubs = {};
	functionNames.forEach((name) => {
		const stub = sinon.stub(module, name);
		stubsArr.push(stub);
		stubs[name] = stub;
	});
	return {
		stubs: stubs,
		restore: () => stubsArr.forEach((stub) => stub.restore()),
	};
};

export const stubOut = (module, functionNames, before = beforeAll, after = afterAll) => {
	let restore;
	before(() => {
		restore = stubModule(module, functionNames).restore;
	});
	after(() => {
		if (restore) {
			restore();
		}
	});
};

export const stubFirebaseAdmin = () => {
	let stubs;

	beforeAll(() => {
		const getBranchDocStub = sinon.stub(firebaseAdmin, 'getBranchDoc').returns({
			doc: getEmptyDoc(),
			mostRecentRemoteKey: 0,
			historyData: {
				timestamps: {},
				currentKey: 0,
				latestKey: 0,
			},
		});
		const getFirebaseTokenStub = sinon.stub(firebaseAdmin, 'getFirebaseToken').returns('');
		const createFirebaseBranchStub = sinon
			.stub(firebaseAdmin, 'createFirebaseBranch')
			.returns({});
		const mergeFirebaseBranchStub = sinon
			.stub(firebaseAdmin, 'mergeFirebaseBranch')
			.returns({});
		stubs = [
			getBranchDocStub,
			getFirebaseTokenStub,
			createFirebaseBranchStub,
			mergeFirebaseBranchStub,
		];
	});

	afterAll(() => stubs.forEach((stub) => stub.restore()));
};
