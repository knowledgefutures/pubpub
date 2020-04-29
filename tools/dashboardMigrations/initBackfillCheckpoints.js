require('@babel/register');
if (process.env.NODE_ENV !== 'production') {
	require('../../server/config.js');
}
require('./backfillCheckpoints.js');
