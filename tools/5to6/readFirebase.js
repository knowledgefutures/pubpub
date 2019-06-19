/* eslint-disable no-console */
require('../../server/config.js');
const bigJson = require('big-json');
const storage = require('./storage');

console.time('Parse Time');
const wd = storage(process.env.MIGRATION_WORKING_DIRECTORY);
const parseStream = bigJson.createParseStream();
parseStream.on('data', (pubs) => {
	Object.keys(pubs).forEach((pubKey) => {
		const pubId = pubKey
			.split('-')
			.slice(1)
			.join('-');
		wd.within(`pubs/${pubId}`, (pubDir) => {
			pubDir.write('firebase-v5.json', JSON.stringify(pubs[pubKey]));
		});
	});
	console.timeEnd('Parse Time');
});
wd.readStream('firebase-v5.json').pipe(parseStream);
