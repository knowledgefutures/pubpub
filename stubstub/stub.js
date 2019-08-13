import sinon from 'sinon';

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
