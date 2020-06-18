import { useState, useEffect } from 'react';
import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';

const readingCollectionParam = 'readingCollection';

const getCollectionFromReadingParam = (queryObj, collections) => {
	return collections.find((collection) =>
		collection.id.startsWith(queryObj[readingCollectionParam]),
	);
};

const fetchCollectionPubs = ({ collectionId, communityId }) =>
	apiFetch(`/api/collectionPubs?collectionId=${collectionId}&communityId=${communityId}`);

export const getNeighborsInCollectionPub = (pubs, currentPub) => {
	if (!pubs) {
		return { previousPub: null, nextPub: null };
	}
	const currentIndex = pubs && pubs.indexOf(pubs.find((p) => p.id === currentPub.id));
	const previousPub = pubs && currentIndex > 0 && pubs[currentIndex - 1];
	const nextPub = pubs && currentIndex !== pubs.length - 1 && pubs[currentIndex + 1];
	return { previousPub: previousPub, nextPub: nextPub };
};

export const createReadingParamUrl = (url, collection) => {
	const urlObject = new URL(url);
	urlObject.searchParams.append(readingCollectionParam, collection.id.split('-')[0]);
	return urlObject.toString();
};

export const chooseCollectionForPub = (pubData, locationData) => {
	const primaryCollectionPub = pubData.collectionPubs.find((cp) => cp.isPrimary);
	return (
		getCollectionFromReadingParam(
			locationData.query,
			pubData.collectionPubs.map((cp) => cp.collection),
		) ||
		(primaryCollectionPub && primaryCollectionPub.collection)
	);
};

export const useCollectionPubs = (updateLocalData, collection) => {
	const [error, setError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [pubs, setPubs] = useState(collection && collection.pubs);
	const { communityData } = usePageContext();

	const updatePubs = (nextPubs) => {
		setPubs(nextPubs);
		updateLocalData('pub', (pubData) => {
			const collectionPubs = pubData.collectionPubs.map((cp) => {
				if (cp.collection.id === collection.id) {
					return {
						...cp,
						collection: {
							...cp.collection,
							pubs: nextPubs,
						},
					};
				}
				return cp;
			});
			return { collectionPubs: collectionPubs };
		});
	};

	useEffect(() => {
		if (!collection) {
			return;
		}
		if (Array.isArray(collection.pubs)) {
			setIsLoading(false);
		}
		fetchCollectionPubs({ collectionId: collection.id, communityId: communityData.id })
			.then((res) => {
				updatePubs(res);
				setIsLoading(false);
			})
			.catch((err) => {
				setError(err);
				setIsLoading(false);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [collection && collection.id]);
	return {
		isLoading: isLoading,
		error: error,
		pubs: pubs,
	};
};
