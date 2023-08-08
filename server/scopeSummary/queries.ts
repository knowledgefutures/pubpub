import {
	Collection,
	CollectionPub,
	Community,
	Discussion,
	Pub,
	ReviewNew,
	ScopeSummary,
} from 'server/models';
import { CreationAttributes, Op } from 'sequelize';
import * as types from 'types';
import { asyncMap } from 'utils/async';
import { addScopeSummaries } from 'utils/scopeSummaries';
import { expect } from 'utils/assert';

const createScopeSummary = (summary: CreationAttributes<ScopeSummary>) =>
	ScopeSummary.create(summary);

const persistScopeSummaryForId = async (
	id: null | string,
	summary: CreationAttributes<ScopeSummary>,
): Promise<string> => {
	if (id) {
		await ScopeSummary.update(summary, { where: { id } });
		return id;
	}
	const newScopeSummary = await createScopeSummary(summary);
	return newScopeSummary.id;
};

const persistScopeSummaryForModel = async (
	model: any,
	summary: CreationAttributes<ScopeSummary>,
) => {
	model.scopeSummaryId = await persistScopeSummaryForId(model.scopeSummaryId, summary);
	await model.save({ hooks: false });
};

export const summarizeCommunity = async (communityId: string) => {
	const community = await Community.findOne({ where: { id: communityId } });

	const pubs = await Pub.findAll({
		where: { communityId },
		include: [
			{
				association: 'submission',
				required: false,
				where: { status: { [Op.ne]: 'incomplete' } },
			},
		],
	});
	const collections = await Collection.count({ where: { communityId } });
	const submissions = pubs.filter((pub) => !!pub.submission);

	const pubsInCommunity = await Pub.findAll({
		where: { communityId },
		include: 'scopeSummary',
	});

	const scopeSummaries = pubsInCommunity
		.map((pub) => pub.scopeSummary)
		.filter((x): x is ScopeSummary => !!x);

	return persistScopeSummaryForModel(community, {
		...addScopeSummaries(...scopeSummaries),
		pubs: pubs.length,
		submissions: submissions.length,
		collections,
	});
};

export const summarizeCollection = async (collectionId: string) => {
	const collection = expect(
		await Collection.findOne({
			where: { id: collectionId },
			include: 'submissionWorkflow',
		}),
	) as types.DefinitelyHas<Collection, 'submissionWorkflow'>;

	const collectionPubs = (await CollectionPub.findAll({
		where: { collectionId },
		include: [
			{
				association: 'pub',
				required: true,
				include: [
					'scopeSummary',
					{
						association: 'submission',
						required: false,
						where: { status: { [Op.ne]: 'incomplete' } },
					},
				],
			},
		],
	})) as (Omit<CollectionPub, 'pub'> & { pub: types.DefinitelyHas<Pub, 'scopeSummary'> })[];

	const submissions = collectionPubs.filter(
		(cp) =>
			collection.submissionWorkflow?.id &&
			cp.pub.submission?.submissionWorkflowId === collection.submissionWorkflow.id,
	);

	const scopeSummaries = collectionPubs
		.map((cp) => cp.pub.scopeSummary)
		.filter((x): x is ScopeSummary => !!x);

	return persistScopeSummaryForModel(collection, {
		...addScopeSummaries(...scopeSummaries),
		pubs: collectionPubs.length,
		submissions: submissions.length,
	});
};

export const summarizePub = async (pubId: string, summarizeParentScopes = true) => {
	const pub = expect(await Pub.findOne({ where: { id: pubId } }));
	const [discussions, reviews] = await Promise.all([
		Discussion.count({ where: { pubId } }),
		ReviewNew.count({ where: { pubId } }),
	]);
	await persistScopeSummaryForModel(pub, {
		discussions,
		reviews,
		submissions: 0,
		pubs: 0,
		collections: 0,
	});
	if (summarizeParentScopes) {
		const collectionPubs = await CollectionPub.findAll({
			where: { pubId },
		});
		await asyncMap(
			collectionPubs,
			(collectionPub) => summarizeCollection(collectionPub.collectionId),
			{ concurrency: 5 },
		);
		await summarizeCommunity(pub.communityId);
	}
};
