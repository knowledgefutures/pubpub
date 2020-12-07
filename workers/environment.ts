require('server/utils/serverModuleOverwrite');

const { setEnvironment, setAppCommit } = require('utils/environment');

setEnvironment(process.env.PUBPUB_PRODUCTION, process.env.IS_DUQDUQ);
setAppCommit(process.env.HEROKU_SLUG_COMMIT);
