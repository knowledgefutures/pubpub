import { useState } from 'react';

import * as api from 'shared/collections/api';
import findRank from 'shared/utils/findRank';

const findRankForSelection = (selections, index) =>
	findRank(
		selections.map((s) => s.rank),
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

const setupCollection = (collection, community) => {
	const page = community.pages.find((pg) => pg.id === collection.pageId);
	return { ...collection, page: page };
};

export const useCollectionPubs = ({
	initialCollectionPubs,
	collectionId,
	communityId,
	promiseWrapper,
}) => {
	const [collectionPubs, setCollectionPubs] = useState(initialCollectionPubs);

	const reorderCollectionPubs = (sourceIndex, destinationIndex) => {
		const nextCollectionPubs = [...collectionPubs];
		const [removed] = nextCollectionPubs.splice(sourceIndex, 1);
		const newRank = findRankForSelection(nextCollectionPubs, destinationIndex);
		const updatedValue = {
			...removed,
			rank: newRank,
		};
		nextCollectionPubs.splice(destinationIndex, 0, updatedValue);
		promiseWrapper(
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
		promiseWrapper(
			api.removeCollectionPub({
				collectionId: collectionId,
				communityId: communityId,
				id: collectionPub.id,
			}),
		);
		setCollectionPubs(collectionPubs.filter((cp) => cp.id !== collectionPub.id));
	};

	const setCollectionPubContextHint = (collectionPub, contextHint) => {
		promiseWrapper(
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
		promiseWrapper(
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
		promiseWrapper(
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

export const useCollectionState = ({
	scopeData: {
		elements: { activeCommunity, activeCollection },
	},
	overviewData,
	promiseWrapper = () => {},
}) => {
	const [collection, setCollection] = useState(
		setupCollection(activeCollection, activeCommunity),
	);

	const { collectionPubs, ...collectionPubsActions } = useCollectionPubs({
		initialCollectionPubs: setupCollectionPubs(overviewData, activeCollection),
		communityId: activeCommunity.id,
		collectionId: collection.id,
		promiseWrapper: promiseWrapper,
	});

	const linkCollectionToPage = (page) => {
		setCollection({ ...collection, pageId: page && page.id, page: page });
		promiseWrapper(
			api.updateCollection({
				communityId: activeCommunity.id,
				collectionId: collection.id,
				updatedCollection: { pageId: page && page.id },
			}),
		);
	};

	const setCollectionPublic = (isPublic) => {
		setCollection({ ...collection, isPublic: isPublic });
		promiseWrapper(
			api.updateCollection({
				communityId: activeCommunity.id,
				collectionId: collection.id,
				updatedCollection: { isPublic: isPublic },
			}),
		);
	};

	return {
		...collectionPubsActions,
		linkCollectionToPage: linkCollectionToPage,
		setCollectionPublic: setCollectionPublic,
		collection: {
			...collection,
			collectionPubs: collectionPubs,
		},
	};
};
