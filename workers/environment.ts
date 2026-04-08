require('server/utils/serverModuleOverwrite');

const { env } = require('server/env');
const { resolveAppCommit } = require('server/utils/appCommit');
const { setEnvironment, setAppCommit } = require('utils/environment');

setEnvironment(env.PUBPUB_PRODUCTION, env.IS_DUQDUQ, env.IS_QUBQUB);

const appCommit = resolveAppCommit();

if (appCommit) {
	setAppCommit(appCommit);
}
