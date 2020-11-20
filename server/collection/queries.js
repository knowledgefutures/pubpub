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

export const createCollection = ({
	communityId,
	title,
	kind,
	pageId = null,
	doi = null,
	isPublic = false,
	id = null,
	slug = null,
}) => {
	return Community.findOne({ where: { id: communityId } }).then(async (community) => {
		const normalizedTitle = title.trim();
		const collection = {
			title: normalizedTitle,
			slug: await findAcceptableSlug(slug || slugifyString(title), communityId),
			isRestricted: true,
			isPublic: isPublic,
			viewHash: generateHash(8),
			editHash: generateHash(8),
			communityId: communityId,
			pageId: pageId,
			doi: doi,
			kind: kind,
			layout: generateDefaultCollectionLayout(),
			...(id && { id: id }),
		};
		const metadata = normalizeMetadataToKind({}, kind, {
			community: community,
			collection: collection,
		});
		return Collection.create({ ...collection, metadata: metadata }, { returning: true });
	});
};

export const updateCollection = async (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	if (filteredValues.slug) {
		filteredValues.slug = slugifyString(filteredValues.slug);
		const available = await slugIsAvailable({
			slug: filteredValues.slug,
			communityId: inputValues.communityId,
			activeElementId: inputValues.collectionId,
		});
		if (!available) {
			throw new PubPubError.InvalidFieldsError('slug');
		}
	}

	return filteredValues;
};

export const destroyCollection = (inputValues) => {
	return Collection.destroy({
		where: { id: inputValues.collectionId },
	});
};
