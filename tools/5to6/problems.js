class ProblemError extends Error {
	constructor(err) {
		super(err);
		this.isLoggedProblem = true;
	}
}

const makeProblemContext = () => {
	return {
		warnings: [],
		errors: [],
	};
};

let problemContext = makeProblemContext();

const getProblemContext = () => {
	if (problemContext.warnings.length || problemContext.errors.length) {
		return problemContext;
	}
	return null;
};

const freshProblemContext = () => {
	problemContext = makeProblemContext();
};

const warn = (message, payload) => {
	console.warn('WARNING', message);
	problemContext.warnings.push(payload ? { message: message, payload: payload } : message);
};

const error = (message, payload) => {
	console.error('ERROR', message);
	problemContext.errors.push(payload ? { message: message, payload: payload } : message);
	return new ProblemError(message.toString());
};

module.exports = {
	warn: warn,
	error: error,
	getProblemContext: getProblemContext,
	freshProblemContext: freshProblemContext,
};
