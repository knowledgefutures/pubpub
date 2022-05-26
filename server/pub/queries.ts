import striptags from 'striptags';

import { Collection, Community, Pub, PubAttribution, Member } from 'server/models';
import { setPubSearchData, deletePubSearchData } from 'server/utils/search';
import { createCollectionPub } from 'server/collectionPub/queries';
import { createDraft } from 'server/draft/queries';
import { slugifyString } from 'utils/strings';
import { generateHash } from 'utils/hashes';
import { getReadableDateInYear } from 'utils/dates';
import { asyncForEach } from 'utils/async';

export const createPub = async (
	{
		communityId,
		collectionIds,
		slug,
		titleKind = 'Untitled Pub',
		...restArgs
	}: { communityId: string; collectionIds?: string[]; slug?: string; [key: string]: any },
	actorId?: string,
) => {
	const newPubSlug = slug ? slug.toLowerCase().trim() : generateHash(8);
	const dateString = getReadableDateInYear(new Date());
	const { defaultPubCollections } = await Community.findOne({ where: { id: communityId } });
	const draft = await createDraft();

	const newPub = await Pub.create(
		{
			title: `${titleKind} on ${dateString}`,
			slug: newPubSlug,
			communityId,
			headerBackgroundColor: 'light',
			headerStyle: 'dark',
			viewHash: generateHash(8),
			editHash: generateHash(8),
			draftId: draft.id,
			...restArgs,
		},
		{ actorId },
	);

	const createPubAttribution =
		actorId &&
		PubAttribution.create({
			userId: actorId,
			pubId: newPub.id,
			isAuthor: true,
			order: 0.5,
		});

	const createMember =
		actorId &&
		Member.create(
			{
				userId: actorId,
				pubId: newPub.id,
				permissions: 'manage',
				isOwner: true,
			},
			{ hooks: false },
		);

	const allCollectionIds: string[] = [...(defaultPubCollections || []), ...(collectionIds || [])];

	const createCollectionPubs = asyncForEach(
		[...new Set(allCollectionIds)].filter((x) => x),
		async (collectionIdToAdd) => {
			// defaultPubCollections isn't constrained by the database in any way and might contain IDs
			// of collections that don't exist, so unfortunately we have to do an existence check here.
			const collection = await Collection.findOne({
				where: { id: collectionIdToAdd, communityId },
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

	await Promise.all([createPubAttribution, createCollectionPubs, createMember].filter((x) => x));

	setPubSearchData(newPub.id);
	return newPub;
};

export const updatePub = (inputValues, updatePermissions, actorId) => {
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
	if (filteredValues.htmlTitle) {
		filteredValues.title = striptags(filteredValues.htmlTitle).replace(/&nbsp;/gi, ' ');
	} else if (filteredValues.title) {
		filteredValues.htmlTitle = filteredValues.title;
	}

	return Pub.update(filteredValues, {
		where: { id: inputValues.pubId },
		individualHooks: true,
		actorId,
	}).then(() => {
		setPubSearchData(inputValues.pubId);
		return filteredValues;
	});
};

export const destroyPub = async (pubId: string, actorId: null | string = null) => {
	const pub = await Pub.findByPk(pubId);
	return pub.destroy({ actorId }).then(() => {
		deletePubSearchData(pubId);
		return true;
	});
};
