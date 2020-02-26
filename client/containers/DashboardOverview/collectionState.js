import { useState } from 'react';

import findRank from 'shared/utils/findRank';

const findRankForCollectionPub = (collectionPubs, index) =>
	findRank(
		collectionPubs.map((s) => s.rank),
		index,
	);

const setupCollectionPubs = (overviewData, collection) => {
	const { pubs, collections } = overviewData;
	const { collectionPubs } = collections.find((col) => col.id === collection.id);
	return collectionPubs
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
		.filter((x) => x)
		.sort((a, b) => (a.rank || '').localeCompare(b.rank || ''));
};

const setupCollection = (collection, community, overviewData) => {
	const { pages } = community;
	const page = pages.find((pg) => pg.id === collection.pageId);
	const collectionPubs = setupCollectionPubs(overviewData, collection);
	return {
		...collection,
		page: page,
		collectionPubs: collectionPubs,
	};
};

const useCollectionPubs = ({
	initialCollectionPubs,
	collectionId,
	communityId,
	promiseWrapper = (x) => x,
}) => {
	const [collectionPubs, setCollectionPubs] = useState(initialCollectionPubs);

	const reorderCollectionPubs = (sourceIndex, destinationIndex) => {
		const nextCollectionPubs = [...collectionPubs];
		const [removed] = nextCollectionPubs.splice(sourceIndex, 1);
		const newRank = findRankForCollectionPub(nextCollectionPubs, destinationIndex);
		const updatedValue = {
			...removed,
			rank: newRank,
		};
		nextCollectionPubs.splice(destinationIndex, 0, updatedValue);
		promiseWrapper(
			apiUpdateCollectionPub({
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
		promiseWrapper(
			apiRemoveCollectionPub({
				collectionId: collectionId,
				communityId: communityId,
				id: collectionPub.id,
			}),
		);
		setCollectionPubs(collectionPubs.filter((cp) => cp.id !== collectionPub.id));
	};

	const setCollectionPubContextHint = (collectionPub, contextHint) => {
		promiseWrapper(
			apiUpdateCollectionPub({
				collectionId: collectionId,
				communityId: communityId,
				id: collectionPub.id,
				update: { contextHint: contextHint },
			}),
		);
		updateCollectionPub({ ...collectionPub, contextHint: contextHint });
	};

	const setCollectionPubIsPrimary = (collectionPub, isPrimary) => {
		promiseWrapper(
			apiSetCollectionPubPrimary({
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
		promiseWrapper(
			apiAddCollectionPub({
				collectionId: collectionId,
				communityId: communityId,
				pubId: pub.id,
			}).then((collectionPub) => {
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

export const useCollectionState = ({
	collection,
	community,
	overviewData,
	promiseWrapper = (x) => x,
}) => {
	const [collectionState] = useState(() => setupCollection(collection, community, overviewData));
	const collectionPubsState = useCollectionPubs({
		initialCollectionPubs: collectionState.collectionPubs,
		collectionId: collection.id,
		communityId: community.id,
		promiseWrapper: promiseWrapper,
	});
	return collectionPubsState;
};
