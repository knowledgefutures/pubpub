import {
	Collection,
	CollectionPub,
	Community,
	Discussion,
	DiscussionAnchor,
	Member,
	Page,
	Pub,
	PubAttribution,
	PubEdge,
	PubVersion,
	Release,
	ScopeSummary,
	Thread,
	ThreadComment,
	User,
} from 'server/models';
import { asyncMap } from 'utils/async';

import { createDraft, getDraftFirebasePath } from 'server/draft/queries';
import { isProd } from 'utils/environment';
import { generateHash } from 'utils/hashes';

import { createFirebaseClient } from './utils/firebase';
import { promptOkay } from './utils/prompt';

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
	const model = await Model.findOne({ where: { id }, raw: true });
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
				await withCreatedModelFn(model, createdModel);
			}
			return createdModel;
		}),
	);
	return map;
};

const updateFirebaseDraftDiscussions = (draftJson, discussionIdMap) => {
	if (draftJson) {
		const { discussions } = draftJson;
		if (discussions) {
			const nextDiscussions = {};
			Object.keys(discussions).forEach((discussionId) => {
				const mappedDiscussionId = discussionIdMap[discussionId];
				nextDiscussions[mappedDiscussionId] = discussions[discussionId];
			});
			return { ...draftJson, discussions: nextDiscussions };
		}
	}
	return draftJson;
};

const cloneFirebaseDraft = async ({ existingDraftId, newDraftId, discussionIdMap }) => {
	const [existingDraftPath, newDraftPath] = await Promise.all(
		[existingDraftId, newDraftId].map((id) => getDraftFirebasePath(id)),
	);
	if (!newDraftPath.startsWith('drafts/draft-')) {
		throw new Error(`Refusing to write to potentially dangerous draft path ${newDraftPath}`);
	}
	const draftJson = await firebaseClient.read(existingDraftPath);
	const draftJsonWithUpdatedDiscussions = updateFirebaseDraftDiscussions(
		draftJson,
		discussionIdMap,
	);
	await firebaseClient.write(newDraftPath, draftJsonWithUpdatedDiscussions);
};

const cloneScopeSummary = async (sourceModel, targetModel) => {
	const [_, scopeSummary] = await cloneModel(ScopeSummary, sourceModel.scopeSummaryId);
	targetModel.scopeSummaryId = scopeSummary.id;
	await targetModel.save();
};

const clonePub = async ({ pubId, newCommunityId, collectionIdMap }) => {
	const draft = await createDraft();
	const [existingPub, newPub] = await cloneModel(Pub, pubId, {
		communityId: newCommunityId,
		slug: generateHash(8),
		draftId: draft.id,
	});
	await cloneScopeSummary(existingPub, newPub);
	// eslint-disable-next-line no-console
	console.log('Cloning', newPub.title);
	const discussionIdMap = await cloneManyModels(
		Discussion,
		{ pubId: existingPub.id },
		{ pubId: newPub.id },
		async (oldDiscussion, newDiscussion) => {
			const [existingThread, newThread] = await cloneModel(Thread, newDiscussion.threadId);
			await Discussion.update(
				{ threadId: newThread.id },
				{ where: { id: newDiscussion.id } },
			);
			await cloneManyModels(
				ThreadComment,
				{ threadId: existingThread.id },
				{ threadId: newThread.id },
			);
			await cloneManyModels(
				DiscussionAnchor,
				{ discussionId: oldDiscussion.id },
				{ discussionId: newDiscussion.id },
			);
		},
	);
	await cloneManyModels(Release, { pubId: existingPub.id }, { pubId: newPub.id });
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
	await cloneFirebaseDraft({
		existingDraftId: existingPub.draftId,
		newDraftId: newPub.draftId,
		discussionIdMap,
	});
	return newPub;
};

const clonePubs = async ({ existingCommunityId, newCommunityId, collectionIdMap }) => {
	const allPubs = await Pub.findAll({ where: { communityId: existingCommunityId } });
	const pubIdMap = {};
	await asyncMap(
		allPubs,
		async (pub) => {
			const newPub = await clonePub({
				pubId: pub.id,
				newCommunityId,
				collectionIdMap,
			});
			pubIdMap[pub.id] = newPub.id;
		},
		{ concurrency: 10 },
	);
	return pubIdMap;
};

const getUpdatedLayoutblockContent = ({ block, pubIdMap, pageIdMap, collectionIdMap }) => {
	const { content, type } = block;
	const { pubIds, pageIds, collectionIds } = content;
	if (content) {
		if (type === 'pubs') {
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
		}
		if (type === 'collections-pages') {
			const items = content.items.map((item) => {
				if (item.type === 'page') {
					return { ...item, id: pageIdMap[item.id] };
				}
				if (item.type === 'collection') {
					return { ...item, id: collectionIdMap[item.id] };
				}
				return items;
			});
			return {
				...block,
				content: {
					...content,
					items,
				},
			};
		}
	}
	return block;
};

const updateLayoutContent = async ({ newCommunityId, pubIdMap, pageIdMap, collectionIdMap }) => {
	const allPages = await Page.findAll({ where: { communityId: newCommunityId } });
	const allCollections = await Collection.findAll({ where: { communityId: newCommunityId } });
	await Promise.all(
		allPages.map((page) => {
			const nextLayout = page.layout.map((block) =>
				getUpdatedLayoutblockContent({ block, pubIdMap, pageIdMap, collectionIdMap }),
			);
			page.layout = nextLayout;
			return page.save();
		}),
	);
	await Promise.all(
		allCollections.map((collection) => {
			const nextBlocks = collection.layout.blocks.map((block) =>
				getUpdatedLayoutblockContent({ block, pubIdMap, pageIdMap, collectionIdMap }),
			);
			collection.layout = { ...collection.layout, blocks: nextBlocks };
			return collection.save();
		}),
	);
};

const getUpdatedCommunityNavigation = ({ items, pageIdMap, collectionIdMap }) => {
	if (items) {
		return items.map((item) => {
			if (item.type === 'page') {
				return { ...item, id: pageIdMap[item.id] };
			}
			if (item.type === 'collection') {
				return { ...item, id: collectionIdMap[item.id] };
			}
			if (item.children) {
				return {
					...item,
					children: getUpdatedCommunityNavigation(item.children, pageIdMap),
				};
			}
			return item;
		});
	}
	return items;
};

const updateCommunityContent = async ({ community, pageIdMap, collectionIdMap }) => {
	// eslint-disable-next-line no-param-reassign
	community.navigation = getUpdatedCommunityNavigation({
		items: community.navigation,
		pageIdMap,
		collectionIdMap,
	});
	community.footerLinks = getUpdatedCommunityNavigation({
		items: community.footerLinks,
		pageIdMap,
		collectionIdMap,
	});
	// eslint-disable-next-line no-param-reassign
	community.defaultPubCollections = community.defaultPubCollections.map(
		(collectionId) => collectionIdMap[collectionId],
	);
	return community.save();
};

const createAdmin = async ({ communityId, userSlug }) => {
	const user = await User.findOne({ where: { slug: userSlug } });
	await Member.create({
		communityId,
		userId: user.id,
		permissions: 'admin',
		isOwner: true,
	});
};

const maybeDestroyPreviouslyCreatedCommunity = async (newSubdomain) => {
	const existingCommunity = await Community.findOne({ where: { subdomain: newSubdomain } });
	if (existingCommunity && !isProd()) {
		await promptOkay(
			`Destroy existing Community "${existingCommunity.title}" at ${existingCommunity.subdomain}?`,
			{
				throwIfNo: true,
			},
		);
		await existingCommunity.destroy();
	}
};

const cloneCommunity = async (existingSubdomain, newSubdomain) => {
	await maybeDestroyPreviouslyCreatedCommunity(newSubdomain);
	const existingCommunity = await Community.findOne({ where: { subdomain: existingSubdomain } });
	const [_, newCommunity] = await cloneModel(Community, existingCommunity.id, {
		subdomain: newSubdomain,
		domain: null,
	});
	await cloneScopeSummary(existingCommunity, newCommunity);
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
			async (oldCollection, newCollection) => {
				await cloneScopeSummary(oldCollection, newCollection);
			},
		);
		const pubIdMap = await clonePubs({
			existingCommunityId: existingCommunity.id,
			newCommunityId: newCommunity.id,
			collectionIdMap,
		});
		await updateLayoutContent({
			newCommunityId: newCommunity.id,
			pubIdMap,
			collectionIdMap,
			pageIdMap,
		});
		await updateCommunityContent({
			community: newCommunity,
			pageIdMap,
			collectionIdMap,
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
