/* eslint-disable no-console, no-unused-vars */
import headerCols from './headerCols';
import dashCols from './dashCols';
import discToThreads from './discToThreads';
import buildReleases from './buildReleases';

const init = async () => {
	try {
		console.log('Beginning Migration');
		// await headerCols();
		// await dashCols();
		// await discToThreads();
		await buildReleases();
	} catch (err) {
		console.log('Error with Migration', err);
	} finally {
		console.log('Ending Migration');
		process.exit();
	}
};
init();
