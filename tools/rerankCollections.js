import { CollectionPub } from 'server/models';
import { rerankCollection } from 'server/utils/collectionQueries';
import { asyncMap } from 'utils/async';

const main = async () => {
	const collectionIdsMis = await CollectionPub.findAll({ where: { rank: null } });
	const collectionIdsMissingRanks = [
		...new Set(collectionIdsMis.map((collectionPub) => collectionPub.collectionId)),
	];
	await asyncMap(collectionIdsMissingRanks, rerankCollection, { concurrency: 5 });
};

main().finally(() => process.exit(0));
