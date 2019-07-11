/* eslint-disable no-console */
require('./setup');
const { getAllPubIds } = require('./v5/queryPub');

const main = async () => {
	const pubIds = await getAllPubIds();
	pubIds.forEach((id) => console.log(id));
};

main();
