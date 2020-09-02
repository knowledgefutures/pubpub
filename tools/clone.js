import Bluebird from 'bluebird';

import {
	Branch,
	Collection,
	CollectionPub,
	Community,
	DiscussionNew,
	Member,
	Page,
	Pub,
	PubAttribution,
	PubEdge,
	PubVersion,
	Release,
	Thread,
	ThreadComment,
	User,
} from 'server/models';

import { isProd } from 'utils/environment';
import { generateHash } from 'utils/hashes';

import { createFirebaseClient } from './utils/firebase';

const {
	argv: { from, to, admin },
} = require('yargs');

const firebaseUrl = isProd()
	? 'https://pubpub-v6-prod.firebaseio.com'
	: 'https://pubpub-v6-dev.firebaseio.com';

const firebaseClient = createFirebaseClient(
	firebaseUrl,
	process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
);

const applyAttributeMaps = (model, attributeMaps) => {
	const nextModel = { ...model };
	if (attributeMaps) {
		Object.entries(attributeMaps).forEach(([attribute, mapOrValue]) => {
			if (mapOrValue && typeof mapOrValue === 'object') {
				const modelValue = model[attribute];
				const mappedValue = mapOrValue[modelValue];
				nextModel[attribute] = mappedValue;
			} else {
				nextModel[attribute] = mapOrValue;
			}
		});
	}
	return nextModel;
};

const cloneModel = async (Model, id, attributeMaps) => {
	const model = await Model.findOne({ where: { id: id }, raw: true });
	const nextModel = applyAttributeMaps(model, attributeMaps);
	delete nextModel.id;
	return [model, await Model.create(nextModel)];
};

const cloneManyModels = async (Model, association, attributeMaps, withCreatedModelFn) => {
	const allModels = await Model.findAll({ where: association, raw: true });
	const map = {};
	await Promise.all(
		allModels.map(async (model) => {
			const nextModel = applyAttributeMaps(model, attributeMaps);
			delete nextModel.id;
			const createdModel = await Model.create(nextModel);
			map[model.id] = createdModel.id;
			if (withCreatedModelFn) {
				await withCreatedModelFn(createdModel);
			}
			return createdModel;
		}),
	);
	return map;
};

const updateFirebaseBranchDiscussions = (branchJson, discussionIdMap) => {
	const { discussions } = branchJson;
	if (discussions) {
		const nextDiscussions = {};
		Object.keys(discussions).forEach((discussionId) => {
			const mappedDiscussionId = discussionIdMap[discussionId];
			nextDiscussions[mappedDiscussionId] = discussions[discussionId];
		});
		return { ...branchJson, discussions: nextDiscussions };
	}
	return branchJson;
};

const cloneFirebasePub = async ({ existingPubId, newPubId, branchIdMap, discussionIdMap }) => {
	const pubJson = await firebaseClient.read(existingPubId);
	if (pubJson) {
		const nextPubJson = {};
		Object.keys(pubJson).forEach((key) => {
			const match = key.match(/^branch-(.*)$/);
			if (match) {
				const branchId = match[1];
				const mappedBranchId = branchIdMap[branchId];
				nextPubJson[`branch-${mappedBranchId}`] = updateFirebaseBranchDiscussions(
					pubJson[key],
					discussionIdMap,
				);
			}
		});
		await firebaseClient.write(newPubId, nextPubJson);
	}
};

const clonePub = async ({ pubId, newCommunityId, collectionIdMap }) => {
	const [existingPub, newPub] = await cloneModel(Pub, pubId, {
		communityId: newCommunityId,
		slug: generateHash(8),
	});
	// eslint-disable-next-line no-console
	console.log('Cloning', newPub.title);
	const branchIdMap = await cloneManyModels(
		Branch,
		{ pubId: existingPub.id },
		{ pubId: newPub.id },
	);
	const discussionIdMap = await cloneManyModels(
		DiscussionNew,
		{ pubId: existingPub.id },
		{ pubId: newPub.id },
		async (discussion) => {
			const [existingThread, newThread] = await cloneModel(Thread, discussion.threadId);
			await cloneManyModels(
				ThreadComment,
				{ threadId: existingThread.id },
				{ threadId: newThread.id },
			);
		},
	);
	await cloneManyModels(
		Release,
		{ pubId: existingPub.id },
		{ pubId: newPub.id, branchId: branchIdMap },
	);
	await cloneManyModels(
		CollectionPub,
		{ pubId: existingPub.id },
		{ pubId: newPub.id, collectionId: collectionIdMap },
	);
	await cloneManyModels(
		PubEdge,
		{ pubId: existingPub.id },
		{ pubId: newPub.id, approvedByTarget: false },
	);
	await cloneManyModels(PubAttribution, { pubId: existingPub.id }, { pubId: newPub.id });
	await cloneManyModels(PubVersion, { pubId: existingPub.id }, { pubId: newPub.id });
	await cloneFirebasePub({
		existingPubId: existingPub.id,
		newPubId: newPub.id,
		branchIdMap: branchIdMap,
		discussionIdMap: discussionIdMap,
	});
	return newPub;
};

const clonePubs = async ({ existingCommunityId, newCommunityId, collectionIdMap }) => {
	const allPubs = await Pub.findAll({ where: { communityId: existingCommunityId } });
	const pubIdMap = {};
	await Bluebird.map(
		allPubs,
		async (pub) => {
			const newPub = await clonePub({
				pubId: pub.id,
				newCommunityId: newCommunityId,
				collectionIdMap: collectionIdMap,
			});
			pubIdMap[pub.id] = newPub.id;
		},
		{ concurrency: 10 },
	);
	return pubIdMap;
};

const updatePageContent = async ({ newCommunityId, pubIdMap, pageIdMap, collectionIdMap }) => {
	const allPages = await Page.findAll({ where: { communityId: newCommunityId } });
	return Promise.all(
		allPages.map((page) => {
			const nextLayout = page.layout.map((block) => {
				const { content } = block;
				const { pubIds, pageIds, collectionIds } = content;
				return {
					...block,
					content: {
						...content,
						...(pubIds && { pubIds: pubIds.map((id) => pubIdMap[id]) }),
						...(pageIds && { pageIds: pageIds.map((id) => pageIdMap[id]) }),
						...(collectionIds && {
							collectionIds: collectionIds.map((id) => collectionIdMap[id]),
						}),
					},
				};
			});
			// eslint-disable-next-line no-param-reassign
			page.layout = nextLayout;
			return page.save();
		}),
	);
};

const getUpdatedCommunityNavigation = (items, pageIdMap) => {
	return items.map((item) => {
		if (typeof item === 'string') {
			return pageIdMap[item];
		}
		if (item.children) {
			return {
				...item,
				children: getUpdatedCommunityNavigation(item.children, pageIdMap),
			};
		}
		return item;
	});
};

const updateCommunityContent = async ({ community, pageIdMap, collectionIdMap }) => {
	// eslint-disable-next-line no-param-reassign
	community.navigation = getUpdatedCommunityNavigation(community.navigation, pageIdMap);
	// eslint-disable-next-line no-param-reassign
	community.defaultPubCollections = community.defaultPubCollections.map(
		(collectionId) => collectionIdMap[collectionId],
	);
	return community.save();
};

const createAdmin = async ({ communityId, userSlug }) => {
	const user = await User.findOne({ where: { slug: userSlug } });
	await Member.create({
		communityId: communityId,
		userId: user.id,
		permissions: 'admin',
		isOwner: true,
	});
};

const cloneCommunity = async (existingSubdomain, newSubdomain) => {
	const existingCommunity = await Community.findOne({ where: { subdomain: existingSubdomain } });
	// eslint-disable-next-line no-unused-vars
	const [_, newCommunity] = await cloneModel(Community, existingCommunity.id, {
		subdomain: newSubdomain,
		domain: null,
	});
	try {
		const pageIdMap = await cloneManyModels(
			Page,
			{ communityId: existingCommunity.id },
			{ communityId: newCommunity.id },
		);
		const collectionIdMap = await cloneManyModels(
			Collection,
			{ communityId: existingCommunity.id },
			{ communityId: newCommunity.id },
		);
		const pubIdMap = await clonePubs({
			existingCommunityId: existingCommunity.id,
			newCommunityId: newCommunity.id,
			collectionIdMap: collectionIdMap,
		});
		await updatePageContent({
			newCommunityId: newCommunity.id,
			pubIdMap: pubIdMap,
			collectionIdMap: collectionIdMap,
			pageIdMap: pageIdMap,
		});
		await updateCommunityContent({
			community: newCommunity,
			pageIdMap: pageIdMap,
			collectionIdMap: collectionIdMap,
		});
		await createAdmin({ communityId: newCommunity.id, userSlug: admin });
	} catch (err) {
		await newCommunity.destroy();
		throw err;
	}
};

const main = async () => {
	await cloneCommunity(from, to);
};

main();
