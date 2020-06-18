let environment;
let appCommit;

const PRODUCTION = 'production';
const DUQDUQ = 'duqduq';
const DEVELOPMENT = 'development';

export const setEnvironment = (isProd, isDuqDuq) => {
	if (isProd) {
		environment = PRODUCTION;
	} else if (isDuqDuq) {
		environment = DUQDUQ;
	} else {
		environment = DEVELOPMENT;
	}
};

export const isProd = () => {
	return environment === PRODUCTION;
};

export const isDuqDuq = () => {
	return environment === DUQDUQ;
};

export const isDevelopment = () => {
	return environment === DEVELOPMENT;
};

export const setAppCommit = (appCommitHash) => {
	appCommit = appCommitHash;
};
export const getAppCommit = () => {
	return appCommit;
};
