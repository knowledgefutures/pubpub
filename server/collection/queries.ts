import { Collection, Community } from 'server/models';
import { slugIsAvailable, findAcceptableSlug } from 'server/utils/slugs';
import { normalizeMetadataToKind } from 'utils/collections/metadata';
import { slugifyString } from 'utils/strings';
import { generateHash } from 'utils/hashes';
import { PubPubError } from 'server/utils/errors';

export const generateDefaultCollectionLayout = () => {
	return {
		isNarrow: false,
		blocks: [
			{
				id: generateHash(8),
				type: 'collection-header',
				content: {},
			},
			{
				type: 'pubs',
				id: generateHash(8),
				content: {
					sort: 'collection-rank',
					pubPreviewType: 'medium',
				},
			},
		],
	};
};

export const createCollection = async (
	{
		communityId,
		title,
		kind,
		pageId = null,
		doi = null,
		isPublic = false,
		isRestricted = true,
		id = null,
		slug = null,
	},
	actorId?,
) => {
	if (title) {
		const desiredSlug = slug || slugifyString(title);
		const slugStatus = await slugIsAvailable({
			slug: desiredSlug,
			communityId,
			activeElementId: id,
		});

		if (slugStatus === 'reserved') {
			throw new PubPubError.ForbiddenSlugError(desiredSlug, slugStatus);
		}
	}
	return Community.findOne({ where: { id: communityId } }).then(async (community) => {
		const normalizedTitle = title.trim();
		const collection = {
			title: normalizedTitle,
			slug: await findAcceptableSlug(slug || slugifyString(title), communityId),
			isRestricted,
			isPublic,
			viewHash: generateHash(8),
			editHash: generateHash(8),
			communityId,
			pageId,
			doi,
			kind,
			layout: generateDefaultCollectionLayout(),
			// @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
			...(id && { id }),
		};
		const metadata = normalizeMetadataToKind({}, kind, {
			community,
			collection,
		});
		return Collection.create({ ...collection, metadata }, { returning: true, actorId });
	});
};

export const updateCollection = async (inputValues, updatePermissions, actorId?) => {
	// Filter to only allow certain fields to be updated
	const filteredValues: Record<string, any> = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	if (filteredValues.slug) {
		filteredValues.slug = slugifyString(filteredValues.slug);
		const slugStatus = await slugIsAvailable({
			slug: filteredValues.slug,
			communityId: inputValues.communityId,
			activeElementId: inputValues.collectionId,
		});

		if (slugStatus !== 'available') {
			throw new PubPubError.ForbiddenSlugError(filteredValues.slug, slugStatus);
		}
	}
	await Collection.update(filteredValues, {
		where: { id: inputValues.collectionId },
		individualHooks: true,
		actorId,
	});
	return filteredValues;
};

export const destroyCollection = (inputValues, actorId?) => {
	return Collection.destroy({
		where: { id: inputValues.collectionId },
		individualHooks: true,
		actorId,
	});
};
