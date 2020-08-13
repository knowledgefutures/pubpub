import Bluebird from 'bluebird';
import { rerankCollection } from 'server/utils/collectionQueries';
import { CollectionPub } from 'server/models';

const main = async () => {
	const collectionIdsMis = await CollectionPub.findAll({ where: { rank: null } });
	const collectionIdsMissingRanks = [
		...new Set(collectionIdsMis.map((collectionPub) => collectionPub.collectionId)),
	];
	await Bluebird.map(collectionIdsMissingRanks, rerankCollection, { concurrency: 5 });
};

main().finally(() => process.exit(0));
