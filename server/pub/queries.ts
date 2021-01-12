import Bluebird from 'bluebird';

import { Collection, Community, Pub, PubAttribution, Branch, Member } from 'server/models';
import { setPubSearchData, deletePubSearchData } from 'server/utils/search';
import { createCollectionPub } from 'server/collectionPub/queries';
import { slugifyString } from 'utils/strings';
import { generateHash } from 'utils/hashes';
import { getReadableDateInYear } from 'utils/dates';

export const createPub = async (
	{ communityId, collectionIds, slug, ...restArgs },
	userId?: string,
) => {
	const newPubSlug = slug ? slug.toLowerCase().trim() : generateHash(8);
	const dateString = getReadableDateInYear(new Date());
	const { defaultPubCollections } = await Community.findOne({ where: { id: communityId } });

	const newPub = await Pub.create({
		title: `Untitled Pub on ${dateString}`,
		slug: newPubSlug,
		communityId: communityId,
		headerBackgroundColor: 'light',
		headerStyle: 'dark',
		viewHash: generateHash(8),
		editHash: generateHash(8),
		...restArgs,
	});

	const createPubAttribution =
		userId &&
		PubAttribution.create({
			userId: userId,
			pubId: newPub.id,
			isAuthor: true,
			order: 0.5,
		});

	const createMember =
		userId &&
		Member.create({
			userId: userId,
			pubId: newPub.id,
			permissions: 'manage',
			isOwner: true,
		});

	const createPublicBranch = Branch.create({
		shortId: 1,
		title: 'public',
		pubId: newPub.id,
	});

	const createDraftBranch = Branch.create({
		shortId: 2,
		title: 'draft',
		pubId: newPub.id,
	});

	const allCollectionIds = [...(defaultPubCollections || []), ...(collectionIds || [])];

	const createCollectionPubs = Bluebird.each(
		[...new Set(allCollectionIds)].filter((x) => x),
		async (collectionIdToAdd) => {
			// defaultPubCollections isn't constrained by the database in any way and might contain IDs
			// of collections that don't exist, so unfortunately we have to do an existence check here.
			const collection = await Collection.findOne({
				where: { id: collectionIdToAdd, communityId: communityId },
			});
			if (collection) {
				return createCollectionPub({
					collectionId: collectionIdToAdd,
					pubId: newPub.id,
				});
			}
			return null;
		},
	);

	await Promise.all(
		[
			createPubAttribution,
			createCollectionPubs,
			createPublicBranch,
			createDraftBranch,
			createMember,
		].filter((x) => x),
	);

	setPubSearchData(newPub.id);
	return newPub;
};

export const updatePub = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues: any = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});
	if (filteredValues.slug) {
		filteredValues.slug = slugifyString(filteredValues.slug);
	}

	return Pub.update(filteredValues, {
		where: { id: inputValues.pubId },
	}).then(() => {
		setPubSearchData(inputValues.pubId);
		return filteredValues;
	});
};

export const destroyPub = (pubId) => {
	return Pub.destroy({
		where: { id: pubId },
	}).then(() => {
		deletePubSearchData(pubId);
		return true;
	});
};
