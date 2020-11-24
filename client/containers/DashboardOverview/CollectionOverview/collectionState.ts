import { useState } from 'react';

import { usePendingChanges, usePageContext } from 'utils/hooks';
import * as api from 'client/utils/collections/api';
import { findRankInRankedList, sortByRank } from 'utils/rank';
import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { usePersistableState } from 'client/utils/usePersistableState';
import { CollectionPub, Pub } from 'utils/types';

const linkCollectionPubs = (overviewData, collection): (CollectionPub & { pub: Pub })[] => {
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
				communityId: communityId,
				id: collectionPub.id,
			}),
		);
		setCollectionPubs(collectionPubs.filter((cp) => cp.id !== collectionPub.id));
	};

	const setCollectionPubContextHint = (collectionPub, contextHint) => {
		pendingPromise(
			api.updateCollectionPub({
				communityId: communityId,
				id: collectionPub.id,
				update: { contextHint: contextHint },
			}),
		);
		updateCollectionPub({ ...collectionPub, contextHint: contextHint });
	};

	const setCollectionPubIsPrimary = (collectionPub) => {
		const { pubId } = collectionPub;
		const pub = overviewData.pubs.find((p) => p.id === pubId);
		if (pub && pub.collectionPubs) {
			const newPubRank = findRankInRankedList(pub.collectionPubs, 0, 'pubRank');
			pendingPromise(
				api.updateCollectionPub({
					communityId: communityId,
					id: collectionPub.id,
					update: { pubRank: newPubRank },
				}),
			);
			updateCollectionPub({ ...collectionPub, pubRank: newPubRank });
		}
	};

	const addCollectionPub = (pub) => {
		const newCollectionPub = {
			collectionId: collectionId,
			pubId: pub.id,
			pub: pub,
		} as any;
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
		setCollectionPubs([...collectionPubs, newCollectionPub]);
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

export const useCollectionState = () => {
	const {
		updateCollection: updateCollectionGlobally,
		scopeData: {
			elements: { activeCollection },
		},
		communityData,
	} = usePageContext();
	const { pendingPromise } = usePendingChanges();

	const { state, error, update, hasChanges, persist } = usePersistableState(
		activeCollection,
		(partialCollection) =>
			pendingPromise(
				api.updateCollection({
					communityId: communityData.id,
					collectionId: activeCollection.id,
					updatedCollection: partialCollection,
				}),
			).then(() => updateCollectionGlobally(partialCollection)),
	);

	const collection = linkCollection(state, communityData);
	const fieldErrors = error?.type === 'InvalidFields' ? error.fields : null;

	const updateCollection = (next) => update(next, true);

	const deleteCollection = () =>
		pendingPromise(
			api.deleteCollection({
				communityId: communityData.id,
				collectionId: collection.id,
			}),
		);

	return {
		fieldErrors: fieldErrors,
		collection: collection,
		hasChanges: hasChanges,
		persistCollection: persist,
		updateCollection: updateCollection,
		deleteCollection: deleteCollection,
	};
};
