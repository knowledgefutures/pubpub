require('@babel/register');
if (process.env.NODE_ENV !== 'production') {
	require('../../server/config.js');
}
const setEnvironment = require('../../shared/utils/environment').setEnvironment;
setEnvironment(process.env.PUBPUB_PRODUCTION, process.env.IS_DUQDUQ);

require('./backfillCheckpoints.js');
