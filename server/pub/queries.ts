import striptags from 'striptags';
import unescape from 'lodash.unescape';

import {
	Collection,
	Community,
	Pub,
	PubAttribution,
	Member,
	CollectionAttribution,
	includeUserModel,
} from 'server/models';
import { setPubSearchData, deletePubSearchData } from 'server/utils/search';
import { createCollectionPub } from 'server/collectionPub/queries';
import { createDraft } from 'server/draft/queries';
import { slugifyString } from 'utils/strings';
import { generateHash } from 'utils/hashes';
import { getReadableDateInYear } from 'utils/dates';
import { asyncForEach } from 'utils/async';
import { buildPubOptions } from 'server/utils/queryHelpers';
import { expect } from 'utils/assert';
import * as types from 'types';
import { Attributes } from 'sequelize';
import { PubPut } from 'utils/api/schemas/pub';
import { PubUpdateableFields } from './permissions';

export const createPub = async (
	{
		communityId,
		collectionIds,
		slug,
		titleKind = 'Untitled Pub',
		...restArgs
	}: { communityId: string; collectionIds?: string[] | null; slug?: string; [key: string]: any },
	actorId?: string,
) => {
	const newPubSlug = slug ? slug.toLowerCase().trim() : generateHash(8);
	const dateString = getReadableDateInYear(new Date());
	const { defaultPubCollections } = expect(
		await Community.findOne({ where: { id: communityId } }),
	);
	const draft = await createDraft();

	const newPub = await Pub.create(
		{
			title: `${titleKind} on ${dateString}`,
			slug: newPubSlug,
			communityId,
			viewHash: generateHash(8),
			editHash: generateHash(8),
			reviewHash: generateHash(8),
			commentHash: generateHash(8),
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

export const updatePub = async (
	inputValues: PubPut,
	updatePermissions: PubUpdateableFields,
	actorId?: string | null,
) => {
	const actualFilteredValues = Object.entries(inputValues).reduce((acc, [key, value]) => {
		if (!updatePermissions?.some((k) => key === k)) {
			return acc;
		}

		acc[key] = value;

		if (key === 'slug' && value) {
			acc.slug = slugifyString(value);
		}

		if (key === 'title' && value && !inputValues.htmlTitle) {
			acc.htmlTitle = value;
		}

		if (key === 'htmlTitle' && value) {
			acc.title = unescape(striptags(value));
		}

		if (key === 'description' && value && !inputValues.htmlDescription) {
			acc.htmlDescription = value;
		}

		if (key === 'htmlDescription' && value) {
			acc.description = unescape(striptags(value));
		}

		if (key === 'customPublishedAt' && value) {
			acc.customPublishedAt = new Date(value);
		}

		return acc;
	}, {} as Attributes<Pub>);

	await Pub.update(actualFilteredValues, {
		where: { id: inputValues.pubId },
		individualHooks: true,
		actorId,
	});
	setPubSearchData(inputValues.pubId);
	return 'customPublishedAt' in actualFilteredValues
		? { ...actualFilteredValues, customPublishedAt: inputValues.customPublishedAt }
		: actualFilteredValues;
};

export const destroyPub = async (pubId: string, actorId: null | string = null) => {
	const pub = expect(await Pub.findByPk(pubId));
	return pub.destroy({ actorId }).then(() => {
		deletePubSearchData(pubId);
		return true;
	});
};

const findCollectionOptions = {
	include: [
		{
			model: CollectionAttribution,
			as: 'attributions',
			include: [includeUserModel({ as: 'user', required: false })],
		},
	],
};

const findPubOptions = buildPubOptions({
	getCommunity: true,
	getEdgesOptions: {
		// Include Pub for both inbound and outbound pub connections
		// since we do a lot of downstream processing with pubEdges.
		includePub: true,
		includeTargetPub: true,
		includeCommunityForPubs: true,
	},
	getCollections: true,
});

export const findCollection = async (collectionId: string) =>
	Collection.findOne({
		where: { id: collectionId },
		...findCollectionOptions,
	}) as Promise<types.DefinitelyHas<Collection, 'attributions'> | null>;

export const findPub = (pubId: string) =>
	Pub.findOne({ where: { id: pubId }, ...findPubOptions }) as Promise<types.DefinitelyHas<
		Pub,
		'community'
	> | null>;
