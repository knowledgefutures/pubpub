import Bluebird from 'bluebird';

import {
	Community,
	Pub,
	Collection,
	CollectionPub,
	Discussion,
	ReviewNew,
	ScopeSummary,
} from 'server/models';
import { ScopeSummary as ScopeSummaryType } from 'types';
import { addScopeSummaries } from 'utils/scopeSummaries';

const createScopeSummary = (summary: ScopeSummaryType) => ScopeSummary.create(summary);

const persistScopeSummaryForId = async (
	id: null | string,
	summary: ScopeSummaryType,
): Promise<string> => {
	if (id) {
		await ScopeSummary.update(summary, { where: { id } });
		return id;
	}
	const newScopeSummary = await createScopeSummary(summary);
	return newScopeSummary.id;
};

const persistScopeSummaryForModel = async (model: any, summary: ScopeSummaryType) => {
	model.scopeSummaryId = await persistScopeSummaryForId(model.scopeSummaryId, summary);
	await model.save();
};

export const summarizeCommunity = async (communityId: string) => {
	const community = await Community.findOne({ where: { id: communityId } });

	const [pubs, collections] = await Promise.all([
		Pub.count({ where: { communityId } }),
		Collection.count({ where: { communityId } }),
	]);

	const pubsInCommunity = await Pub.findAll({
		where: { communityId },
		include: [{ model: ScopeSummary, as: 'scopeSummary' }],
	});

	const scopeSummaries: ScopeSummaryType[] = pubsInCommunity
		.map((pub) => pub.scopeSummary)
		.filter((x): x is ScopeSummaryType => !!x);

	return persistScopeSummaryForModel(community, {
		...addScopeSummaries(...scopeSummaries),
		pubs,
		collections,
	});
};

export const summarizeCollection = async (collectionId: string) => {
	const collection = await Collection.findOne({ where: { id: collectionId } });

	const collectionPubs = await CollectionPub.findAll({
		where: { collectionId },
		include: [
			{ model: Pub, as: 'pub', include: [{ model: ScopeSummary, as: 'scopeSummary' }] },
		],
	});

	const scopeSummaries: ScopeSummaryType[] = collectionPubs
		.map((cp) => cp.pub.scopeSummary)
		.filter((x): x is ScopeSummaryType => !!x);

	return persistScopeSummaryForModel(collection, {
		...addScopeSummaries(...scopeSummaries),
		pubs: collectionPubs.length,
	});
};

export const summarizePub = async (pubId: string, summarizeParentScopes = true) => {
	const pub = await Pub.findOne({ where: { id: pubId } });
	const [discussions, reviews] = await Promise.all([
		Discussion.count({ where: { pubId } }),
		ReviewNew.count({ where: { pubId } }),
	]);
	await persistScopeSummaryForModel(pub, {
		discussions,
		reviews,
		pubs: 0,
		collections: 0,
	});
	if (summarizeParentScopes) {
		const collectionPubs = await CollectionPub.findAll({ where: { pubId } });
		await Bluebird.map(
			collectionPubs,
			(collectionPub) => summarizeCollection(collectionPub.collectionId),
			{ concurrency: 5 },
		);
		await summarizeCommunity(pub.communityId);
	}
};
