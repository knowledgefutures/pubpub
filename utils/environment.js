let environment;
let appCommit;

const PRODUCTION = 'production';
const QUBQUB = 'qubqub';
const DUQDUQ = 'duqduq';
const DEVELOPMENT = 'development';

export const setEnvironment = (isProd, isDuqDuq, isQubQub) => {
	if (isProd) {
		environment = PRODUCTION;
	} else if (isDuqDuq) {
		environment = DUQDUQ;
	} else if (isQubQub) {
		environment = QUBQUB;
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

export const isQubQub = () => {
	return environment === QUBQUB;
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

export const canSelectCommunityForDevelopment = () => {
	return isDevelopment() || isQubQub();
};

export const shouldForceBasePubPub = () => {
	return process.env.FORCE_BASE_PUBPUB === 'true' && canSelectCommunityForDevelopment();
};
