/* eslint-disable global-require */
if (process.env.NODE_ENV !== 'production') {
	require(require('path').join(process.cwd(), 'config'));
}
require('server/utils/serverModuleOverwrite');

const { setEnvironment, setAppCommit } = require('utils/environment');

setEnvironment(process.env.PUBPUB_PRODUCTION, process.env.IS_DUQDUQ, process.env.IS_QUBQUB);
setAppCommit(process.env.HEROKU_SLUG_COMMIT);
