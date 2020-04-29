/* eslint-disable */
import fs from 'fs';
import uuidv4 from 'uuid/v4';
import firebaseAdmin from 'firebase-admin';
import { Discussion, Pub, Collection, CollectionPub, Version } from '../v5/models';
import { nestDiscussionsToThreads } from '../../../client/containers/Pub/PubDocument/PubDiscussions/discussionUtils';

const serviceAccount = JSON.parse(
	Buffer.from(process.env.V5_FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
);

const firebaseApp =
	firebaseAdmin.apps.length > 0
		? firebaseAdmin.apps[0]
		: firebaseAdmin.initializeApp(
				{
					credential: firebaseAdmin.credential.cert(serviceAccount),
					databaseURL: process.env.V5_FIREBASE_URL,
				},
				'firebase-pub-new',
		  );
const database = firebaseApp.database();

const workingDirectory = process.env.MIGRATION_WORKING_DIRECTORY;
const frankenbookFile = fs.readFileSync(`${workingDirectory}/frankenbook-firebase.json`);
const frankenbookVersionFile = fs.readFileSync(`${workingDirectory}/frankenbook-version.json`);
const frankJson = JSON.parse(frankenbookFile);
const frankVersionJson = JSON.parse(frankenbookVersionFile);

const generateHash = (length) => {
	const tokenLength = length || 32;
	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

	let hash = '';
	for (let index = 0; index < tokenLength; index += 1) {
		hash += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return hash;
};

const originalPubId = '0f21f44a-dc5e-4e8d-83b8-d1194e38d755';
const newBaseId = '0f21f44a-dc5e-4e8d-83b8-d1194e38d756';
const sectionsData = frankJson.sections
	.sort((foo, bar) => {
		if (foo.order < bar.order) {
			return -1;
		}
		if (foo.order > bar.order) {
			return 1;
		}
		return 0;
	})
	.map((section) => {
		return {
			id: section.id || newBaseId,
			title: section.title,
			changes: section.id ? frankJson[section.id].changes : frankJson.changes,
			checkpoint: section.id ? frankJson[section.id].checkpoint : frankJson.checkpoint,
			volume: section.volume,
			rank:
				section.order < 20
					? `a${String.fromCharCode(97 + section.order)}`
					: `b${String.fromCharCode(97 + section.order - 20)}`,
		};
	});

const newPubs = sectionsData.map((sectionData) => {
	return {
		id: sectionData.id,
		title: sectionData.title,
		slug: generateHash(8),
		avatar: 'https://assets.pubpub.org/co0ekms7/61523982259632.png',
		useHeaderImage: true,
		firstPublishedAt: '2018-04-30 14:49:22.512+00',
		lastPublishedAt: '2018-08-09 14:02:24.519+00',
		draftEditHash: generateHash(8),
		draftViewHash: generateHash(8),
		/* eslint-disable-next-line */
		labels: [
			{
				id: '696a6603-c195-4116-8a60-a340302a2fec',
				color: '#A74F83',
				title: 'Equity & Inclusion',
				publicApply: false,
			},
			{
				id: '9fa38b4c-b2ad-413a-8bf4-2afdcbc3bb01',
				color: '#184B60',
				title: 'Health & Medicine',
				publicApply: false,
			},
			{
				id: '5443a9be-6597-4ba7-a443-e4f6b6584480',
				color: '#471A0D',
				title: 'Influences & Adaptations',
				publicApply: false,
			},
			{
				id: 'a4b89bdc-1119-41e1-8f5a-c63609af4818',
				color: '#66AECD',
				title: 'Mary Shelley',
				publicApply: false,
			},
			{
				id: '6c6f479e-56e8-43a0-b570-a16e005db59b',
				color: '#2B7557',
				title: 'Motivations & Sentiments',
				publicApply: false,
			},
			{
				id: '6643033c-c0f6-4ef5-88d5-b799a4f8e1f9',
				color: '#52BE94',
				title: 'Philosophy & Politics',
				publicApply: false,
			},
			{
				id: '0b4332ea-3291-480a-887f-27dd58e07fb4',
				color: '#A9BB38',
				title: 'Science',
				publicApply: false,
			},
			{
				id: 'fd696f73-a1fc-4ffe-88bd-455736457c05',
				color: '#D34F27',
				title: 'Technology',
				publicApply: false,
			},
		],
		isCommunityAdminManaged: true,
		communityId: '3edffb1d-6f33-4c34-94d9-e08e905655e0',
		createdAt: '2018-04-17 16:23:30.659+00',
	};
});

const newCollectionId = uuidv4();
const vol1TagId = uuidv4();
const vol2TagId = uuidv4();
const vol3TagId = uuidv4();

const newCollections = [
	{
		id: newCollectionId,
		title: 'Frankenstein Book',
		isPublic: true,
		isRestricted: true,
		communityId: '3edffb1d-6f33-4c34-94d9-e08e905655e0',
		kind: 'book',
	},
	{
		id: vol1TagId,
		title: 'Volume I',
		isPublic: true,
		isRestricted: true,
		communityId: '3edffb1d-6f33-4c34-94d9-e08e905655e0',
		kind: 'tag',
	},
	{
		id: vol2TagId,
		title: 'Volume II',
		isPublic: true,
		isRestricted: true,
		communityId: '3edffb1d-6f33-4c34-94d9-e08e905655e0',
		kind: 'tag',
	},
	{
		id: vol3TagId,
		title: 'Volume III',
		isPublic: true,
		isRestricted: true,
		communityId: '3edffb1d-6f33-4c34-94d9-e08e905655e0',
		kind: 'tag',
	},
];

const newCollectionPubsBook = sectionsData.map((sectionData) => {
	return {
		pubId: sectionData.id,
		collectionId: newCollectionId,
		rank: sectionData.rank,
		isPrimary: true,
		metadata: {},
	};
});

const newCollectionPubsTag = sectionsData
	.filter((sectionData) => {
		return sectionData.volume;
	})
	.map((sectionData) => {
		let tagCollectionId;
		if (sectionData.volume === 1) {
			tagCollectionId = vol1TagId;
		}
		if (sectionData.volume === 2) {
			tagCollectionId = vol2TagId;
		}
		if (sectionData.volume === 3) {
			tagCollectionId = vol3TagId;
		}
		return {
			pubId: sectionData.id,
			collectionId: tagCollectionId,
			rank: sectionData.rank,
			metadata: {},
		};
	});

const newVersions = frankVersionJson.map((section, index) => {
	return {
		pubId: sectionsData[index].id,
		content: section.content,
		isPublic: true,
		viewHash: generateHash(8),
		createAt: '2018-08-09 14:02:24.552+00',
	};
});

const createPubs = Pub.bulkCreate(newPubs);
const createCollection = Collection.bulkCreate(newCollections);
Promise.all([createPubs, createCollection])
	.then(() => {
		console.log('Done with Pub and Collection writes');
		return Discussion.findAll({
			where: { pubId: originalPubId },
		});
	})
	.then((discussionsData) => {
		console.log('Done with get Discussions');
		const discussionJsons = discussionsData.map((data) => data.toJSON());
		const threads = nestDiscussionsToThreads(discussionJsons);
		const threadsUpdatePubId = threads.map((thread) => {
			const discussionWithHighlight = thread.find((discussion) => {
				return discussion.highlights;
			});
			const newPubId = discussionWithHighlight
				? discussionWithHighlight.highlights[0].section || newBaseId
				: newBaseId;
			return thread.map((discussion) => {
				return {
					...discussion,
					id: undefined,
					pubId: newPubId,
				};
			});
		});
		const threadNumbers = {};
		const threadsWithUpdatedThreadNumber = threadsUpdatePubId
			.sort((foo, bar) => {
				if (foo[0].threadNumber < bar[0].threadNumber) {
					return -1;
				}
				if (foo[0].threadNumber > bar[0].threadNumber) {
					return 1;
				}
				return 0;
			})
			.map((thread) => {
				const currentThreadNumber = threadNumbers[thread[0].pubId] || 0;
				const nextThreadNumber = currentThreadNumber + 1;
				threadNumbers[thread[0].pubId] = nextThreadNumber;
				return thread.map((discussion) => {
					return {
						...discussion,
						threadNumber: nextThreadNumber,
					};
				});
			});
		const newDiscussions = threadsWithUpdatedThreadNumber.reduce((prev, curr) => {
			return [...prev, ...curr];
		}, []);
		return Discussion.bulkCreate(newDiscussions);
	})
	.then(() => {
		console.log('Done with Discussion writes');
		return CollectionPub.bulkCreate([...newCollectionPubsBook, ...newCollectionPubsTag]);
	})
	.then(() => {
		console.log('Done with CollectionPub writes');
		return Version.bulkCreate(newVersions);
	})
	.then(() => {
		console.log('Done with Version writes');
		const firebaseWrites = sectionsData.map((sectionData) => {
			return database.ref(`pub-${sectionData.id}`).set({
				changes: sectionData.changes || null,
				checkpoint: sectionData.checkpoint || null,
			});
		});
		return Promise.all(firebaseWrites);
	})
	.then(() => {
		console.log('Done with Firebase writes');
	})
	.catch((err) => {
		console.error(err);
	});
