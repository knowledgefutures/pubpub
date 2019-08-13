/* eslint-disable no-console */

/* These are imported separately in case the source */
/* and dest databases are different. E.g. prod to dev */
import {
	Pub as Pub_source,
	PubManager as PubManager_source,
	PubAttribution as PubAttribution_source,
	Discussion as Discussion_source,
	Branch as Branch_source,
	BranchPermission as BranchPermission_source,
	PubVersion as PubVersion_source,
	Merge as Merge_source,
	Review as Review_source,
	ReviewEvent as ReviewEvent_source,
} from './sourceModels';
import {
	Pub as Pub_dest,
	PubManager as PubManager_dest,
	PubAttribution as PubAttribution_dest,
	Discussion as Discussion_dest,
	Branch as Branch_dest,
	BranchPermission as BranchPermission_dest,
	PubVersion as PubVersion_dest,
	Merge as Merge_dest,
	Review as Review_dest,
	ReviewEvent as ReviewEvent_dest,
} from './destModels';

const createFirebaseClient = require('../5to6/util/createFirebaseClient');

require('../../server/config.js');

const sourceFirebaseUrl = 'https://pubpub-v6-dev.firebaseio.com';
const destFirebaseUrl = 'https://pubpub-v6-prod.firebaseio.com';

/* ----- NOTICE -----
This code works to move pubs between databases. If
you wish to move pubs between communities, this is
not the write script for you. */
const pubsToMove = [
	// 'e988d07b-9d46-49ff-bc87-b2a0fc71c1cb',
	// 'd2112c45-7188-490e-a8c2-28542097a749',
	// 'c1de2e38-47da-4a16-a70a-d04cd2136cb0',
	// 'be542c24-e383-4eb9-a631-5903caaaa70d',
];
// const newCommunityId = 'c153eec9-671d-4d38-a720-8e7164f6e12a';
const newCommunityId = '0417b0c0-cd38-48bd-8a84-b0b95da98813';

/*
When moving a pub between communities, the following has to change:
Pub (copied):
	communityId
Branches (copied)
BranchPermission (copied)
Discussion (copied):
	communityId
Merge (copied):
PubAttribution (copied):
PubManager (copied):
PubVersion (copied):
Review (copied):
ReviewEvent (copied):
*/

const findPubs = pubsToMove.map((pubId) => {
	return Pub_source.findOne({
		where: { id: pubId },
		include: [
			{
				model: Branch_source,
				as: 'branches',
				include: [{ model: BranchPermission_source, as: 'permissions', required: false }],
			},
			{ model: Discussion_source, as: 'discussions', required: false },
			{ model: Merge_source, as: 'merges', required: false },
			{ model: PubAttribution_source, as: 'attributions', required: false },
			{ model: PubManager_source, as: 'managers' },
			{ model: PubVersion_source, as: 'pubVersions', required: false },
			{
				model: Review_source,
				as: 'reviews',
				required: false,
				include: [{ model: ReviewEvent_source, as: 'reviewEvents', required: false }],
			},
		],
	});
});
Promise.all(findPubs)
	.then((pubsData) => {
		const updatedPubs = pubsData.map((pub) => {
			const pubData = pub.toJSON();
			pubData.communityId = newCommunityId;
			pubData.discussions = pubData.discussions.map((discussion) => {
				return { ...discussion, communityId: newCommunityId };
			});
			return pubData;
		});

		const createPubs = updatedPubs.map((updatedPub) => {
			return Pub_dest.create(updatedPub, {
				include: [
					{
						model: Branch_dest,
						as: 'branches',
						include: [{ model: BranchPermission_dest, as: 'permissions' }],
					},
					{ model: Discussion_dest, as: 'discussions' },
					{ model: Merge_dest, as: 'merges' },
					{ model: PubAttribution_dest, as: 'attributions' },
					{ model: PubManager_dest, as: 'managers' },
					{ model: PubVersion_dest, as: 'pubVersions' },
					{
						model: Review_dest,
						as: 'reviews',
						include: [{ model: ReviewEvent_dest, as: 'reviewEvents' }],
					},
				],
			});
		});
		return Promise.all(createPubs);
	})
	.then(() => {
		const createSourceClient = createFirebaseClient(
			sourceFirebaseUrl,
			process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
		);
		const createDestClient = createFirebaseClient(
			destFirebaseUrl,
			process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
		);
		return Promise.all([createSourceClient, createDestClient]);
	})
	.then(([sourceClient, destClient]) => {
		const sourceReader = sourceClient.reader;
		const destWriter = destClient.writer;
		const readPubs = Promise.all(pubsToMove.map((id) => sourceReader(id)));
		return Promise.all([destWriter, readPubs]);
	})
	.then(([destWriter, pubsFirebaseData]) => {
		const writeFirebaseData = pubsFirebaseData.map((data, index) => {
			return destWriter(pubsToMove[index], JSON.parse(data));
		});
		return Promise.all(writeFirebaseData);
	})
	.catch((err) => {
		console.log(err);
	})
	.finally(() => {
		console.log('Finishing Move');
		process.exit();
	});
