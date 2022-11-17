import {
	setup,
	teardown,
	login,
	modelize,
	determinize,
	editPub,
	expectCreatedActivityItem,
} from 'stubstub';

import { DiscussionAnchor, Doc, Export, Release } from 'server/models';
import { getExportFormats } from 'utils/export/formats';
import { createDiscussion } from 'server/discussion/queries';
import { DocJson } from 'types';

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
		Pub discussPub {
			Member {
				permissions: "admin"
				User discussPubAdmin {}
			}
		}
	}
	User rando {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

afterEach(async () => {
	const { pub } = models;
	await Release.destroy({ where: { pubId: pub.id } });
});

teardown(afterAll);

const createReleaseRequest = ({ community, pub, ...rest }) => ({
	communityId: community.id,
	pubId: pub.id,
	noteText: '',
	noteContent: {},
	...rest,
});

const createDiscussionForPub = ({
	pubId,
	userId,
	visibilityAccess = 'public',
	historyKey,
	from,
	to,
	...rest
}: {
	pubId: string;
	userId: string;
	from: number;
	to: number;
	historyKey: number;
	visibilityAccess?: 'public' | 'members';
}) => {
	return createDiscussion({
		pubId,
		visibilityAccess,
		text: 'whatever',
		content: {} as DocJson,
		historyKey,
		initAnchorData: {
			from,
			to,
			exact: 'whatever',
		},
		...rest,
		userId,
	});
};

const determinizeAnchor = determinize(['historyKey', 'selection']);

describe('/api/releases', () => {
	it('refuses to create a Release for non-admins of a Pub', async () => {
		const { community, pub, pubManager } = models;
		const pubEditor = await editPub(pub.id);
		await pubEditor
			.transform((tr, schema) => tr.insert(1, schema.text('Release me!')))
			.writeChange();
		const agent = await login(pubManager);
		await agent
			.post('/api/releases')
			.send(
				createReleaseRequest({
					community,
					pub,
					historyKey: pubEditor.getKey(),
					createExports: false,
				}),
			)
			.expect(403);
	});

	it('will create an empty Release for admins of a Pub', async () => {
		const { community, pub, pubAdmin } = models;
		const agent = await login(pubAdmin);
		const pubEditor = await editPub(pub.id);
		await pubEditor.clearChanges();
		const { body: release } = await agent
			.post('/api/releases')
			.send(
				createReleaseRequest({
					community,
					pub,
					historyKey: pubEditor.getKey(),
					createExports: false,
				}),
			)
			.expect(201);
		const doc = await Doc.findOne({ where: { id: release.docId } });
		expect(doc.content).toEqual(pubEditor.getDoc().toJSON());
	});

	it('will create a Release (and associated exports) for admins of a Pub', async () => {
		const { community, pub, pubAdmin } = models;
		const pubEditor = await editPub(pub.id);
		await pubEditor
			.transform((tr, schema) => tr.insert(1, schema.text('Helloooooo')))
			.writeChange();
		const agent = await login(pubAdmin);
		const { body: release } = await expectCreatedActivityItem(
			agent
				.post('/api/releases')
				.send(
					createReleaseRequest({
						community,
						pub,
						historyKey: pubEditor.getKey(),
					}),
				)
				.expect(201),
		).toMatchResultingObject((response) => ({
			kind: 'pub-release-created',
			pubId: pub.id,
			actorId: pubAdmin.id,
			payload: { releaseId: response.body.id },
		}));
		expect(release.historyKey).toEqual(0);
		// Check for a doc with Release contents
		const doc = await Doc.findOne({ where: { id: release.docId } });
		expect(doc.content).toEqual(pubEditor.getDoc().toJSON());
		// Check for exports in the expected formats
		const createdExports = await Export.findAll({ where: { pubId: pub.id } });
		expect(getExportFormats().every((fmt) => createdExports.some((exp) => exp.format === fmt)));
	});

	it('will not create duplicate Releases for the same history key of a Pub', async () => {
		const { community, pub, pubAdmin } = models;
		const agent = await login(pubAdmin);
		const pubEditor = await editPub(pub.id);
		await pubEditor
			.transform((tr, schema) => tr.insert(1, schema.text('Here is exactly one change')))
			.writeChange();
		const { body: release } = await agent
			.post('/api/releases')
			.send(
				createReleaseRequest({
					community,
					pub,
					historyKey: pubEditor.getKey(),
				}),
			)
			.expect(201);
		expect(release.historyKey).toEqual(1);
		// Check for a doc with Release contents
		const doc = await Doc.findOne({ where: { id: release.docId } });
		expect(doc.content).toEqual(pubEditor.getDoc().toJSON());
		const { body: error } = await agent
			.post('/api/releases')
			.send(
				createReleaseRequest({
					community,
					pub,
					historyKey: pubEditor.getKey(),
				}),
			)
			.expect(400);
		expect(error).toEqual('duplicate-release');
	});

	it('will map discussions made on Pubs forward to future Releases', async () => {
		const { community, discussPub: pub, discussPubAdmin: pubAdmin, rando } = models;
		const agent = await login(pubAdmin);

		const pubEditor = await editPub(pub.id);
		await pubEditor
			.transform((tr, schema) => tr.insert(1, schema.text('Add some comments to me!')))
			.writeChange();

		const createRelease = async () => {
			const { body: release } = await agent
				.post('/api/releases')
				.send(
					createReleaseRequest({
						community,
						pub,
						historyKey: pubEditor.getKey(),
					}),
				)
				.expect(201);
			return release;
		};

		const release = await createRelease();

		const [discussion1, discussion2] = await Promise.all([
			createDiscussionForPub({
				pubId: pub.id,
				userId: rando.id,
				from: 8,
				to: 10,
				historyKey: release.historyKey,
			}),
			createDiscussionForPub({
				pubId: pub.id,
				userId: rando.id,
				from: 1,
				to: 3,
				historyKey: release.historyKey,
			}),
		]);

		await pubEditor.transform((tr) => tr.deleteRange(1, 4));
		await pubEditor.writeChange();
		await pubEditor.transform((tr, schema) => tr.insert(1, schema.text('Anchor')));
		await pubEditor.writeChange();

		const nextRelease = await createRelease();

		const discussion3 = await createDiscussionForPub({
			pubId: pub.id,
			userId: rando.id,
			from: 9,
			to: 12,
			historyKey: nextRelease.historyKey,
		});

		const discussion4 = await createDiscussionForPub({
			pubId: pub.id,
			userId: rando.id,
			from: 1,
			to: 7,
			historyKey: nextRelease.historyKey,
		});

		await pubEditor.transform((tr, schema) => {
			tr.insert(10, schema.text('Really mucking this up now'));
			tr.insert(1, schema.text('Schmanchor'));
		});
		await pubEditor.writeChange();

		await createRelease();

		const [discussion1Anchors, discussion2Anchors, discussion3Anchors, discussion4Anchors] =
			await Promise.all(
				[discussion1, discussion2, discussion3, discussion4].map((discussion) =>
					DiscussionAnchor.findAll({
						where: { discussionId: discussion.id },
					}).then((anchors) => anchors.map((a) => determinizeAnchor(a.toJSON()))),
				),
			);

		expect(discussion1Anchors).toEqual([
			{ historyKey: 0, selection: { type: 'text', anchor: 8, head: 10 } },
			{ historyKey: 2, selection: { type: 'text', anchor: 11, head: 13 } },
			{ historyKey: 3, selection: { type: 'text', anchor: 47, head: 49 } },
		]);

		expect(discussion2Anchors).toEqual([
			{ historyKey: 0, selection: { type: 'text', anchor: 1, head: 3 } },
			{ historyKey: 2, selection: null },
			{ historyKey: 3, selection: null },
		]);

		expect(discussion3Anchors).toEqual([
			{ historyKey: 2, selection: { type: 'text', anchor: 9, head: 12 } },
			{ historyKey: 3, selection: { type: 'text', anchor: 19, head: 48 } },
		]);

		expect(discussion4Anchors).toEqual([
			{ historyKey: 2, selection: { type: 'text', anchor: 1, head: 7 } },
			{ historyKey: 3, selection: { type: 'text', anchor: 11, head: 17 } },
		]);
	});
});
