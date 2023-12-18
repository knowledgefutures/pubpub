import striptags from 'striptags';
import unescape from 'lodash.unescape';
import type { Attributes } from 'sequelize';

import * as types from 'types';
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
import { createImport } from 'server/import/queries';
import { writeDocumentToPubDraft } from 'server/utils/firebaseTools';

import { slugifyString } from 'utils/strings';
import { generateHash } from 'utils/hashes';
import { getReadableDateInYear } from 'utils/dates';
import { asyncForEach } from 'utils/async';
import { buildPubOptions } from 'server/utils/queryHelpers';
import { expect } from 'utils/assert';
import type { PubPut } from 'utils/api/schemas/pub';

import { pingTask } from 'client/utils/pingTask';
import type { ImportBody } from 'utils/api/schemas/import';

import { PubPubError } from 'server/utils/errors';
import type { PubUpdateableFields } from './permissions';

export const createPub = async (
	{
		communityId,
		collectionIds,
		slug,
		titleKind = 'Untitled Pub',
		title,
		...restArgs
	}: { communityId: string; collectionIds?: string[] | null; slug?: string; [key: string]: any },
	actorId?: string,
	including?: ('draft' | 'members' | 'attributions')[],
) => {
	const newPubSlug = slug ? slug.toLowerCase().trim() : generateHash(8);
	const dateString = getReadableDateInYear(new Date());
	const { defaultPubCollections } = expect(
		await Community.findOne({ where: { id: communityId } }),
	);
	const draft = await createDraft();

	let newPub: Pub;
	try {
		newPub = await Pub.create(
			{
				title: title ?? `${titleKind} on ${dateString}`,
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
	} catch (e: any) {
		e.errors.forEach((error: any) => {
			if (error.type === 'unique violation') {
				throw new PubPubError.ForbiddenSlugError(newPubSlug, 'used');
			}
		});
		throw new Error(e);
	}

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

	const [attribution, _, member] = await Promise.all([
		createPubAttribution,
		createCollectionPubs,
		createMember,
	]);

	setPubSearchData(newPub.id);

	switch (true) {
		case including?.includes('draft'):
			newPub.draft = draft;
			break;

		case including?.includes('members'):
			if (member) {
				newPub.members = [member];
			}
			break;

		case including?.includes('attributions'):
			if (attribution) {
				newPub.attributions = [attribution];
			}
			break;
		default:
			break;
	}

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

	try {
		await Pub.update(actualFilteredValues, {
			where: { id: inputValues.pubId },
			individualHooks: true,
			actorId,
		});
	} catch (e: any) {
		e.errors.forEach((error: any) => {
			if (error.type === 'unique violation') {
				throw new PubPubError.ForbiddenSlugError(actualFilteredValues.slug, 'used');
			}
		});
		throw new Error(e);
	}
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

export const importToPub = async ({
	pubId,
	baseUrl,
	importBody,
	method,
}: {
	pubId: string;
	baseUrl: string;
	importBody: ImportBody;
	method?: 'replace' | 'overwrite' | 'append' | 'prepend';
}) => {
	const taskData = await createImport(importBody);

	const task = (await pingTask(taskData.id, 1000, 1000, baseUrl)) as {
		doc: any;
		pandocErrorOutput: string;
	};

	await writeDocumentToPubDraft(pubId, task.doc, { method });
	return task;
};
