const getPipedPubIds = require('./util/getPipedPubIds');
const { storage } = require('./setup');

const cleanPubById = (pubId) => {
	const pubDir = storage.within(`pubs/${pubId}`);
	pubDir.rm('transformed.json');
	pubDir.rm('problems.json');
};

const main = async () => {
	const pipedPubIds = await getPipedPubIds();
	pipedPubIds.forEach((pubId) => cleanPubById(pubId));
};

main();
