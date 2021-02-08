import Bluebird from 'bluebird';
import { findAcceptableSlug } from 'server/utils/slugs';

const updateSlugForCollection = async (collectionModel) => {
	const { communityId, slug } = collectionModel;
	const newSlug = await findAcceptableSlug(`${slug}-collection`, communityId);
	// eslint-disable-next-line no-console
	console.log(`${slug} -> ${newSlug}`);
	collectionModel.slug = newSlug;
	await collectionModel.save();
};

const updateCollidingSlugsInCommunity = async (communityId, models) => {
	const { Collection, Page } = models;
	const [collections, pages] = await Promise.all([
		Collection.findAll({ where: { communityId } }),
		Page.findAll({ where: { communityId } }),
	]);
	const collidingCollections = collections.filter((c) => pages.some((p) => p.slug === c.slug));
	await Promise.all(collidingCollections.map(updateSlugForCollection));
};

module.exports = async ({ models }) => {
	const { Community } = models;
	await Bluebird.map(
		await Community.findAll(),
		(community) => updateCollidingSlugsInCommunity(community.id, models),
		{ concurrency: 10 },
	);
};
