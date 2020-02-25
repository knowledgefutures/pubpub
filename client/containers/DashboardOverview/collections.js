import { useState } from 'react';

import findRank from 'shared/utils/findRank';
import { apiFetch } from 'utils';

const apiRoot = '/api/collectionPubs';
const defaultPromiseWrapper = (x) => x;

const findRankForSelection = (selections, index) =>
	findRank(
		selections.map((s) => s.rank),
		index,
	);

const apiAddCollectionPub = ({ pubId, collectionId, communityId }) =>
	apiFetch(apiRoot, {
		method: 'POST',
		body: JSON.stringify({
			pubId: pubId,
			collectionId: collectionId,
			communityId: communityId,
			moveToTop: true,
		}),
	});

const apiUpdateCollectionPub = ({ collectionId, communityId, id, update }) =>
	apiFetch(apiRoot, {
		method: 'PUT',
		body: JSON.stringify({
			...update,
			id: id,
			collectionId: collectionId,
			communityId: communityId,
		}),
	});

const apiRemoveCollectionPub = ({ communityId, collectionId, id }) =>
	apiFetch(apiRoot, {
		method: 'DELETE',
		body: JSON.stringify({
			id: id,
			collectionId: collectionId,
			communityId: communityId,
		}),
	});

const apiSetCollectionPubPrimary = ({ communityId, collectionId, id, isPrimary }) =>
	apiFetch(`${apiRoot}/setPrimary`, {
		method: 'PUT',
		body: JSON.stringify({
			isPrimary: isPrimary,
			id: id,
			communityId: communityId,
			collectionId: collectionId,
		}),
	});

export const useCollectionPubs = ({
	initialCollectionPubs,
	collectionId,
	communityId,
	promiseWrapper = defaultPromiseWrapper,
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
