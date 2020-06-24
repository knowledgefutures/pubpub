import { Pub, PubAttribution, CollectionPub, Branch, Member } from 'server/models';
import { setPubSearchData, deletePubSearchData } from 'server/utils/search';
import { slugifyString } from 'utils/strings';
import { generateHash } from 'utils/hashes';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const createPub = async (
	{ communityId, defaultCollectionIds = [], ...restArgs },
	userId,
) => {
	const newPubSlug = generateHash(8);
	const date = new Date();
	const dateString = `${months[date.getMonth()]} ${date.getDate()}`;

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
			isOwner: true /* TODO: I don't believe isOwner is fully implemented yet, so we should not rely on it. */,
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

	const createCollectionPubs = CollectionPub.bulkCreate(
		defaultCollectionIds.map((collectionId) => {
			return {
				pubId: newPub.id,
				collectionId: collectionId,
			};
		}),
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
	const filteredValues = {};
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

export const destroyPub = (inputValues) => {
	return Pub.destroy({
		where: { id: inputValues.pubId },
	}).then(() => {
		deletePubSearchData(inputValues.pubId);
		return true;
	});
};
