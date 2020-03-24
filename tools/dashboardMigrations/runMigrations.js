/* eslint-disable no-console, no-unused-vars */
import headerCols from './headerCols';
import dashCols from './dashCols';
import discToThreads from './discToThreads';
import reviewsToThreads from './reviewsToThreads';
import buildReleases from './buildReleases';

const init = async () => {
	try {
		console.log('Beginning Migration');
		// await dashCols();
		// await headerCols();
		// await buildReleases();
		// await discToThreads();
		// await reviewsToThreads();
	} catch (err) {
		console.log('Error with Migration', err);
	} finally {
		console.log('Ending Migration');
		process.exit();
	}
};
init();
