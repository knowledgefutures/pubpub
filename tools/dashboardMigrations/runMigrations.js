/* eslint-disable no-console, no-unused-vars */
import { setEnvironment } from '../../shared/utils/environment';
setEnvironment(process.env.PUBPUB_PRODUCTION, process.env.IS_DUQDUQ);

import headerCols from './headerCols';
import dashCols from './dashCols';
import discToThreads from './discToThreads';
import reviewsToThreads from './reviewsToThreads';
import buildReleases from './buildReleases';



const init = async () => {
	console.time('Migration RunTime');
	try {
		console.log('Beginning Migration');
		await dashCols();
		console.log('Finished dashCols');
		await headerCols();
		console.log('Finished headerCols');
		await buildReleases();
		console.log('Finished buildReleases');
		await discToThreads();
		console.log('Finished discToThreads');
		await reviewsToThreads();
		console.log('Finished reviewsToThreads');
	} catch (err) {
		console.log('Error with Migration', err);
	} finally {
		console.log('Ending Migration');
		console.timeEnd('Migration RunTime');
		process.exit();
	}
};
init();
