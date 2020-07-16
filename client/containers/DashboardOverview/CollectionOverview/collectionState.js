import { useState } from 'react';

import { usePendingChanges, usePageContext } from 'utils/hooks';
import * as api from 'client/utils/collections/api';
import { findRankInRankedList, sortByRank } from 'utils/rank';
import ensureUserForAttribution from 'utils/ensureUserForAttribution';

const linkCollectionPubs = (overviewData, collection) => {
	const { pubs, collections } = overviewData;
	const { collectionPubs } = collections.find((col) => col.id === collection.id);
	return sortByRank(
		collectionPubs
			.map((collectionPub) => {
				const pub = pubs.find((somePub) => somePub.id === collectionPub.pubId);
				if (pub) {
					return {
						...collectionPub,
						pub: pub,
					};
				}
				return null;
			})
			.filter((x) => x),
	);
};

const linkCollection = (collection, community) => {
	const page = community.pages.find((pg) => pg.id === collection.pageId);
	const attributions = collection.attributions.map(ensureUserForAttribution);
	return { ...collection, page: page, attributions: attributions };
};

export const useCollectionPubs = (scopeData, overviewData) => {
	const {
		elements: { activeCommunity, activeCollection },
	} = scopeData;
	const { pendingPromise } = usePendingChanges();

	const [collectionPubs, setCollectionPubs] = useState(
		linkCollectionPubs(overviewData, activeCollection),
	);
	const communityId = activeCommunity.id;
	const collectionId = activeCollection.id;

	const reorderCollectionPubs = (sourceIndex, destinationIndex) => {
		const nextCollectionPubs = [...collectionPubs];
		const [removed] = nextCollectionPubs.splice(sourceIndex, 1);
		const newRank = findRankInRankedList(nextCollectionPubs, destinationIndex);
		const updatedValue = {
			...removed,
			rank: newRank,
		};
		nextCollectionPubs.splice(destinationIndex, 0, updatedValue);
		pendingPromise(
			api.updateCollectionPub({
				collectionId: collectionId,
				communityId: communityId,
				id: updatedValue.id,
				update: { rank: newRank },
			}),
		);
		setCollectionPubs(nextCollectionPubs);
	};

	const updateCollectionPub = (collectionPub) => {
		setCollectionPubs(
			collectionPubs.map((cp) => {
				if (cp.id === collectionPub.id) {
					return collectionPub;
				}
				return cp;
			}),
		);
	};

	const removeCollectionPub = (collectionPub) => {
		pendingPromise(
			api.removeCollectionPub({
				collectionId: collectionId,
				communityId: communityId,
				id: collectionPub.id,
			}),
		);
		setCollectionPubs(collectionPubs.filter((cp) => cp.id !== collectionPub.id));
	};

	const setCollectionPubContextHint = (collectionPub, contextHint) => {
		pendingPromise(
			api.updateCollectionPub({
				collectionId: collectionId,
				communityId: communityId,
				id: collectionPub.id,
				update: { contextHint: contextHint },
			}),
		);
		updateCollectionPub({ ...collectionPub, contextHint: contextHint });
	};

	const setCollectionPubIsPrimary = (collectionPub, isPrimary) => {
		pendingPromise(
			api.setCollectionPubPrimary({
				collectionId: collectionId,
				communityId: communityId,
				id: collectionPub.id,
				isPrimary: isPrimary,
			}),
		);
		updateCollectionPub({ ...collectionPub, isPrimary: isPrimary });
	};

	const addCollectionPub = (pub) => {
		const newCollectionPub = {
			collectionId: collectionId,
			pubId: pub.id,
			pub: pub,
		};
		pendingPromise(
			api
				.addCollectionPub({
					collectionId: collectionId,
					communityId: communityId,
					pubId: pub.id,
				})
				.then((collectionPub) => {
					const fullCollectionPub = { ...collectionPub, ...newCollectionPub };
					setCollectionPubs((newestCollectionPubs) =>
						newestCollectionPubs.map((cp) => {
							if (cp.pubId === fullCollectionPub.pubId) {
								return fullCollectionPub;
							}
							return cp;
						}),
					);
				}),
		);
		setCollectionPubs([newCollectionPub, ...collectionPubs]);
	};

	return {
		addCollectionPub: addCollectionPub,
		collectionPubs: collectionPubs,
		removeCollectionPub: removeCollectionPub,
		reorderCollectionPubs: reorderCollectionPubs,
		setCollectionPubContextHint: setCollectionPubContextHint,
		setCollectionPubIsPrimary: setCollectionPubIsPrimary,
	};
};

export const useCollectionState = (scopeData) => {
	const {
		elements: { activeCommunity, activeCollection },
	} = scopeData;

	const pageContext = usePageContext();
	const { pendingPromise } = usePendingChanges();

	const [collection, setCollection] = useState(linkCollection(activeCollection, activeCommunity));

	const updateCollection = (update) => {
		setCollection(linkCollection({ ...collection, ...update }, activeCommunity));
		pendingPromise(
			api.updateCollection({
				communityId: activeCommunity.id,
				collectionId: collection.id,
				updatedCollection: update,
			}),
		).then(() => pageContext.updateCollection(update));
	};

	const deleteCollection = () =>
		pendingPromise(
			api.deleteCollection({
				communityId: activeCommunity.id,
				collectionId: collection.id,
			}),
		);

	return {
		collection: collection,
		updateCollection: updateCollection,
		deleteCollection: deleteCollection,
	};
};
