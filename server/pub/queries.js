import uuidv4 from 'uuid/v4';
import { Pub, PubManager, PubAttribution, CollectionPub, Branch } from '../models';
import { generateHash, slugifyString } from '../utils';
import { setPubSearchData, deletePubSearchData } from '../utils/search';

export const createPub = (inputValues, userData) => {
	const newPubSlug = generateHash(8);
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	const date = new Date();
	const dateString = `${months[date.getMonth()]} ${date.getDate()}`;

	return Pub.create({
		title: `Untitled Pub on ${dateString}`,
		slug: newPubSlug,
		communityId: inputValues.communityId,
		// draftPermissions: 'private',
		isCommunityAdminManaged: true,
		// draftEditHash: generateHash(8),
		// draftViewHash: generateHash(8),
		headerBackgroundColor: 'light',
		headerStyle: 'dark',
	})
		.then((newPub) => {
			const createPubManager = PubManager.create({
				userId: userData.id,
				pubId: newPub.id,
			});
			const createPubAttribution = PubAttribution.create({
				userId: userData.id,
				pubId: newPub.id,
				isAuthor: true,
				order: 0.5,
			});

			const draftBranchId = uuidv4();
			const publicBranchId = uuidv4();
			const createPublicBranch = Branch.create({
				id: publicBranchId,
				shortId: 1,
				title: 'public',
				order: 0.01,
				viewHash: generateHash(8),
				discussHash: generateHash(8),
				editHash: generateHash(8),
				publicPermissions: 'discuss',
				pubManagerPermissions: 'discuss',
				communityAdminPermissions: 'manage',
				pubId: newPub.id,
			});
			const createDraftBranch = Branch.create({
				id: draftBranchId,
				shortId: 2,
				title: 'draft',
				order: 0.9,
				viewHash: generateHash(8),
				discussHash: generateHash(8),
				editHash: generateHash(8),
				publicPermissions: 'none',
				pubManagerPermissions: 'manage',
				communityAdminPermissions: 'manage',
				pubId: newPub.id,
			});
			const defaultCollectionIds = inputValues.defaultCollectionIds || [];
			const newCollectionPubObjects = defaultCollectionIds.map((collectionId) => {
				return {
					kind: 'tag',
					pubId: newPub.id,
					collectionId: collectionId,
				};
			});
			const createCollectionPubs = CollectionPub.bulkCreate(newCollectionPubObjects);
			return Promise.all([
				newPub,
				createPubManager,
				createPubAttribution,
				createCollectionPubs,
				createPublicBranch,
				createDraftBranch,
			]);
		})
		.then(([newPub]) => {
			setPubSearchData(newPub.id);
			return newPub;
		});
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
