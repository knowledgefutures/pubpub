/* global it, expect, beforeAll, afterAll, afterEach */
import { setup, teardown, login, stubOut, modelize } from 'stubstub';

import { Export, Release } from 'server/models';
import { getExportFormats } from 'utils/export/formats';

const models = modelize`
	Community community {
		Pub pub {
			Member {
				permissions: "manage"
				User pubManager {}
            }
            Member {
                permissions: "admin"
                User pubAdmin {}
            }
		}
		Pub exportablePub {
			Member {
				permissions: "admin"
				user: pubAdmin
			}
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

afterEach(async () => {
	const { pub } = models;
	await Release.destroy({ where: { pubId: pub.id } });
});

teardown(afterAll);

stubOut('server/utils/firebaseAdmin', {
	mergeFirebaseBranch: () => ({ mergeKey: 0 }),
	getLatestKey: () => 0,
	getBranchDoc: () => {
		return {
			historyData: { latestKey: 0 },
		};
	},
});

const createReleaseRequest = ({ community, pub, ...rest }) => ({
	communityId: community.id,
	pubId: pub.id,
	noteText: '',
	noteContent: {},
	...rest,
});

it('refuses to create a Release for non-admins of a Pub', async () => {
	const { community, pub, pubManager } = models;
	const agent = await login(pubManager);
	await agent
		.post('/api/releases')
		.send(
			createReleaseRequest({
				community: community,
				pub: pub,
				draftKey: 0,
				createExports: false,
			}),
		)
		.expect(403);
});

it('will create a Release for admins of a Pub', async () => {
	const { community, pub, pubAdmin } = models;
	const agent = await login(pubAdmin);
	const { body: release } = await agent
		.post('/api/releases')
		.send(
			createReleaseRequest({
				community: community,
				pub: pub,
				draftKey: 0,
				createExports: false,
			}),
		)
		.expect(201);
	expect(release.historyKey).toEqual(0);
});

it('will create a Release for admins of a Pub', async () => {
	const { community, pub, pubAdmin } = models;
	const agent = await login(pubAdmin);
	const { body: release } = await agent
		.post('/api/releases')
		.send(
			createReleaseRequest({
				community: community,
				pub: pub,
				draftKey: 0,
				createExports: false,
			}),
		)
		.expect(201);
	expect(release.historyKey).toEqual(0);
});

it('will not create duplicate Releases for the same draft-key of a Pub', async () => {
	const { community, pub, pubAdmin } = models;
	const agent = await login(pubAdmin);
	await agent
		.post('/api/releases')
		.send(
			createReleaseRequest({
				community: community,
				pub: pub,
				draftKey: 0,
				createExports: false,
			}),
		)
		.expect(201);
	await agent
		.post('/api/releases')
		.send(
			createReleaseRequest({
				community: community,
				pub: pub,
				draftKey: 0,
				createExports: false,
			}),
		)
		.expect(500);
});

it('will export the Pub to every supported export format upon release', async () => {
	const { community, exportablePub, pubAdmin } = models;
	const agent = await login(pubAdmin);
	await agent
		.post('/api/releases')
		.send(
			createReleaseRequest({
				community: community,
				pub: exportablePub,
				draftKey: 0,
				createExports: false,
			}),
		)
		.expect(201);
	const createdExports = await Export.findAll({ where: { pubId: exportablePub.id } });
	expect(getExportFormats().every((fmt) => createdExports.some((exp) => exp.format === fmt)));
});
