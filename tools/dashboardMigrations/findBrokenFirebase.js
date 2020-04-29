/* eslint-disable no-console */
import { Branch } from '../../server/models';

const firebaseAdmin = require('firebase-admin');
require('../../server/config.js');

const serviceAccount = JSON.parse(
	Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(),
);
const firebaseApp =
	firebaseAdmin.apps.length > 0
		? firebaseAdmin.apps[0]
		: firebaseAdmin.initializeApp(
				{
					credential: firebaseAdmin.credential.cert(serviceAccount),
					databaseURL: 'https://pubpub-v6-prod.firebaseio.com',
				},
				'firebase-pub-new',
		  );
const database = firebaseApp.database();
// TODO: There are a set of pubs (e.g. designandscience) that have changes written on their merge branch.
// As such, there is not an associated Merge of PubVersion object. We will need to go through firebase,
// find all such pubs, move changes into merges, increment the counter, and create releases.
/* TODO Update: This was an artifact from the time when  header and discussion placement 
accidentally created new change steps on the public branch. All resolved.
*/

const problemPubs = [
	'bfafd97b-528e-4051-ab2d-0c4ba17516bb',
	'5e9745d1-b32f-4303-9d46-424128bee02e',
	'f4c68887-b279-4437-86f0-00972f2c3df5',
	'25ecb69b-f8e8-4915-8f91-09d3a2209f60',
	'd2217ffc-cfbd-4dc7-af0b-f222854999b5',
	'cbc5edbc-d446-4b25-8cc2-0408c6ee276d',
	'2c991b08-0b20-46be-ad04-057592d8d56c',
	'0686eef6-039f-4cb7-912b-ef0b4149ec40',
	'97ff26fd-2d08-4a1d-aee5-e0f8c5d8e9a8',
	'a5b0b36a-d334-4d3e-aee1-89d13afecd5a',
	'3249ee62-f547-44df-9478-2ac52e223359',
	'78776233-4572-4868-af58-70c59ec683f1',
	'8479807c-c9bf-4416-918d-11ac4fbcd1ee',
	'783e7e24-63ab-4018-b3f5-5be496e18096',
	'b7b24981-a6af-4335-9044-f3f6bb59ca7e',
	'7e0ef759-291d-4f62-8598-25178ac94b0b',
	'cb377052-121a-43e9-8114-2d1aee8c80f6',
	'f875537b-6bfa-4ec2-8579-2e90214f672a',
	'8d489367-69d2-46f7-8efb-a3c49e0c1c43',
	'00b14114-58ba-4d92-93e4-69c00bcce509',
	'5df50eb0-79da-4b73-a165-52ac54b189ba',
	'9b0513c9-79ae-410f-9569-de320999b4aa',
	'7e0583ad-fcdb-4322-bfe2-b21f0057282e',
	'7f2e5f08-cfb5-43a1-8eb4-5da0d26bba52',
	'942410b9-e42b-45c3-b6f8-3b2e62bdd712',
	'76694041-7e3d-459d-875e-7c07c032fb80',
	'fd45c1be-b2de-4b7d-bf92-867fa9b50d35',
	'3f86d174-6bef-4681-9aac-1ae6a0473d55',
	'594813d0-57e6-4f28-9283-4ff060da1a2b',
	'533c0e6f-16e0-4dd0-af49-68c4bb708f02',
	'326d73d3-c7af-4278-9728-55023df7bc56',
	'71bb5dab-9251-4796-a25d-6a9db1f7fb04',
	'0483241c-e414-4757-b62f-79d6699cd68c',
	'31568843-bf8e-4b02-bf8d-6648d0d1dfde',
	'5ac343fc-dfa9-4dbe-9459-d954ed547c4f',
	'b59f7abc-917d-4efc-b2be-af21c20eda08',
	'7e966bac-45b4-4ce0-97d6-3a10217a452d',
	'60cc4e3d-6c00-4d3c-b44e-410fea004447',
	'c23aabdc-b066-4dd3-b5c1-87019237ae93',
	'04661128-1fb6-43f1-9eaa-8302b541dc97',
	'cf0b4b6a-e4e0-42a9-8c31-bf7ab6fb53a4',
	'c252e192-6ad1-4873-ae5b-ce9a96ef4916',
	'5c78902f-f033-4205-8840-0389bc105211',
	'e6e9d27e-4c8e-46bc-bfca-7f33eb283e34',
	'87ff5bee-2ace-4c51-a036-74f3ad55f39b',
	'9a1fbecd-f4ba-4a5f-9276-da0b0ad6ccd3',
	'2bc8dbe4-9770-408a-b686-b4c1609d4027',
	'bdbcb5bb-1117-4f4e-97fe-558e1239e726',
	'5d3d96c2-041d-4179-9672-1e32199902c1',
	'da7ab873-93d4-4e7f-9409-3161a621b8c2',
	'170e70a1-0722-428c-b371-2de15960564d',
	'84d4755f-560c-4b3c-baa6-7f0538fcee65',
	'18fe19b0-365e-486d-8b88-044c25a3c14b',
	'8d01cb21-995f-4056-b764-61376098c9dc',
	'cca053ad-a3a2-4795-acfa-ffcb267207ae',
	'7df242c8-a53d-4d05-bcf6-8bff5b94b13c',
	'181fdeef-686d-4161-b034-480c93f7b594',
	'5df09a94-733e-4732-ba33-39d576c6906e',
	'0ac63f5f-a282-488a-a901-47ceea04b6d4',
	'a1435a0f-59bd-4c23-b004-e33838e3d705',
	'06c52076-527b-4d68-8912-4e383b66b7f9',
	'45957184-c0b3-4ed1-ad00-2ceb976df467',
	'a61ee552-2cdf-4e2e-acc8-4e2750a6e3a8',
	'1588318c-2f64-4cd9-aaf4-15e8b5221193',
	'662356f8-f4af-4401-bfdf-f804abf1e065',
	'eec9d9ac-a6ec-47a5-97f8-106ff224fbfe',
	'7e6f266f-1fa6-4e49-8e4f-22720afbd901',
	'7c1d2c0b-ea41-48c7-988b-89ddf432ba2a',
	'75339ead-1184-442a-a9e7-3c4eb2c50fb0',
	'2b05b032-f394-494a-a699-3938115de810',
	'e3853ef2-cd01-46f0-9bbd-48b0412f1e52',
	'1c237140-5125-48a8-8579-9f3df625dfc5',
	'f1855604-45e8-4295-90bc-2eae7aca565f',
];

export default async () => {
	let publicBranches = await Branch.findAll({
		where: { title: 'public' },
		attributes: ['id', 'title', 'shortId', 'firstKeyAt', 'pubId', 'createdAt'],
	});
	publicBranches = publicBranches.filter((br) => {
		return problemPubs.includes(br.pubId);
	});

	/* Takes 12 minutes */
	for (let i = 0; i < publicBranches.length; i++) {
		const changesRef = database.ref(
			`pub-${publicBranches[i].pubId}/branch-${publicBranches[i].id}/changes`,
		);
		/* eslint-disable-next-line no-await-in-loop */
		const data = await changesRef.once('value');
		const val = data.val();
		if (val) {
			// await changesRef.remove();
			// const checkpointRef = database.ref(
			// 	`pub-${publicBranches[i].pubId}/branch-${publicBranches[i].id}/checkpoint`,
			// );
			// await checkpointRef.remove();
			// console.log(val);
			// const realSteps = .filter((step) => !!step);
			if (Object.values(val)[0].cId.indexOf('b242f616-7aaa-479c-8ee5-3933dcf70859') > -1) {
				console.log(
					`${publicBranches[i].pubId} has ${
						Object.values(val).length
					} changes. Needs migration`,
				);
			} else {
				console.log(
					`${publicBranches[i].pubId} has ${
						Object.values(val).length
					} changes. Can delete ${Object.values(val)[0].cId}`,
				);
			}
		}
	}

	// Query firebase for all public branches
};

/*
bfafd97b-528e-4051-ab2d-0c4ba17516bb has 1 changes
5e9745d1-b32f-4303-9d46-424128bee02e has 1 changes
f4c68887-b279-4437-86f0-00972f2c3df5 has 1 changes
25ecb69b-f8e8-4915-8f91-09d3a2209f60 has 1 changes
d2217ffc-cfbd-4dc7-af0b-f222854999b5 has 1 changes
cbc5edbc-d446-4b25-8cc2-0408c6ee276d has 1 changes
2c991b08-0b20-46be-ad04-057592d8d56c has 1 changes
0686eef6-039f-4cb7-912b-ef0b4149ec40 has 1 changes
97ff26fd-2d08-4a1d-aee5-e0f8c5d8e9a8 has 1 changes
a5b0b36a-d334-4d3e-aee1-89d13afecd5a has 1 changes
3249ee62-f547-44df-9478-2ac52e223359 has 1 changes
78776233-4572-4868-af58-70c59ec683f1 has 1 changes
8479807c-c9bf-4416-918d-11ac4fbcd1ee has 1 changes
783e7e24-63ab-4018-b3f5-5be496e18096 has 6 changes
b7b24981-a6af-4335-9044-f3f6bb59ca7e has 1 changes
7e0ef759-291d-4f62-8598-25178ac94b0b has 1 changes
cb377052-121a-43e9-8114-2d1aee8c80f6 has 1 changes
f875537b-6bfa-4ec2-8579-2e90214f672a has 10 changes
8d489367-69d2-46f7-8efb-a3c49e0c1c43 has 1 changes
00b14114-58ba-4d92-93e4-69c00bcce509 has 1 changes
5df50eb0-79da-4b73-a165-52ac54b189ba has 1 changes
9b0513c9-79ae-410f-9569-de320999b4aa has 1 changes
7e0583ad-fcdb-4322-bfe2-b21f0057282e has 1 changes
7f2e5f08-cfb5-43a1-8eb4-5da0d26bba52 has 1 changes
942410b9-e42b-45c3-b6f8-3b2e62bdd712 has 1 changes
76694041-7e3d-459d-875e-7c07c032fb80 has 2 changes
fd45c1be-b2de-4b7d-bf92-867fa9b50d35 has 1 changes
3f86d174-6bef-4681-9aac-1ae6a0473d55 has 61 changes
594813d0-57e6-4f28-9283-4ff060da1a2b has 1 changes
533c0e6f-16e0-4dd0-af49-68c4bb708f02 has 1 changes
326d73d3-c7af-4278-9728-55023df7bc56 has 1 changes
71bb5dab-9251-4796-a25d-6a9db1f7fb04 has 1 changes
0483241c-e414-4757-b62f-79d6699cd68c has 1 changes
31568843-bf8e-4b02-bf8d-6648d0d1dfde has 1 changes
5ac343fc-dfa9-4dbe-9459-d954ed547c4f has 1 changes
b59f7abc-917d-4efc-b2be-af21c20eda08 has 1 changes
7e966bac-45b4-4ce0-97d6-3a10217a452d has 1 changes
60cc4e3d-6c00-4d3c-b44e-410fea004447 has 1 changes
c23aabdc-b066-4dd3-b5c1-87019237ae93 has 1 changes
04661128-1fb6-43f1-9eaa-8302b541dc97 has 1 changes
cf0b4b6a-e4e0-42a9-8c31-bf7ab6fb53a4 has 2 changes
c252e192-6ad1-4873-ae5b-ce9a96ef4916 has 4 changes
5c78902f-f033-4205-8840-0389bc105211 has 6 changes
e6e9d27e-4c8e-46bc-bfca-7f33eb283e34 has 1 changes
87ff5bee-2ace-4c51-a036-74f3ad55f39b has 95 changes
9a1fbecd-f4ba-4a5f-9276-da0b0ad6ccd3 has 1 changes
2bc8dbe4-9770-408a-b686-b4c1609d4027 has 6 changes
bdbcb5bb-1117-4f4e-97fe-558e1239e726 has 1 changes
5d3d96c2-041d-4179-9672-1e32199902c1 has 1 changes
da7ab873-93d4-4e7f-9409-3161a621b8c2 has 1 changes
170e70a1-0722-428c-b371-2de15960564d has 1 changes
84d4755f-560c-4b3c-baa6-7f0538fcee65 has 1 changes
18fe19b0-365e-486d-8b88-044c25a3c14b has 1 changes
8d01cb21-995f-4056-b764-61376098c9dc has 1 changes
cca053ad-a3a2-4795-acfa-ffcb267207ae has 1 changes
7df242c8-a53d-4d05-bcf6-8bff5b94b13c has 1 changes
181fdeef-686d-4161-b034-480c93f7b594 has 1 changes
5df09a94-733e-4732-ba33-39d576c6906e has 1 changes
0ac63f5f-a282-488a-a901-47ceea04b6d4 has 1 changes
a1435a0f-59bd-4c23-b004-e33838e3d705 has 1 changes
06c52076-527b-4d68-8912-4e383b66b7f9 has 1 changes
45957184-c0b3-4ed1-ad00-2ceb976df467 has 1 changes
a61ee552-2cdf-4e2e-acc8-4e2750a6e3a8 has 1 changes
1588318c-2f64-4cd9-aaf4-15e8b5221193 has 1 changes
662356f8-f4af-4401-bfdf-f804abf1e065 has 2 changes
eec9d9ac-a6ec-47a5-97f8-106ff224fbfe has 1 changes
7e6f266f-1fa6-4e49-8e4f-22720afbd901 has 1 changes
7c1d2c0b-ea41-48c7-988b-89ddf432ba2a has 1 changes
75339ead-1184-442a-a9e7-3c4eb2c50fb0 has 4 changes
2b05b032-f394-494a-a699-3938115de810 has 1 changes
e3853ef2-cd01-46f0-9bbd-48b0412f1e52 has 1 changes
1c237140-5125-48a8-8579-9f3df625dfc5 has 1 changes
f1855604-45e8-4295-90bc-2eae7aca565f has 1 changes
*/
