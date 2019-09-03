import sinon from 'sinon';

import { getEmptyDoc } from '@pubpub/editor/dist/utils';
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

export const stubFirebaseAdmin = () => {
	/* global beforeAll, afterAll */
	let stubs;

	beforeAll(() => {
		const getBranchDocStub = sinon.stub(firebaseAdmin, 'getBranchDoc').returns({
			content: getEmptyDoc(),
			mostRecentRemoteKey: 0,
			historyData: {
				timestamps: {},
				currentKey: 0,
				latestKey: 0,
			},
			checkpointUpdates: undefined,
		});
		const getFirebaseTokenStub = sinon.stub(firebaseAdmin, 'getFirebaseToken').returns('');
		const createFirebaseBranchStub = sinon
			.stub(firebaseAdmin, 'createFirebaseBranch')
			.returns({});
		const mergeFirebaseBranchStub = sinon
			.stub(firebaseAdmin, 'mergeFirebaseBranch')
			.returns({});
		const updateFirebaseDiscussionStub = sinon
			.stub(firebaseAdmin, 'updateFirebaseDiscussion')
			.returns({});
		stubs = [
			getBranchDocStub,
			getFirebaseTokenStub,
			createFirebaseBranchStub,
			mergeFirebaseBranchStub,
			updateFirebaseDiscussionStub,
		];
	});

	afterAll(() => stubs.forEach((stub) => stub.restore()));
};
