import { useState } from 'react';
import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';
import { getPrimaryCollection } from 'utils/collections/primary';

const readingCollectionParam = 'readingCollection';

const getCollectionFromReadingParam = (queryObj, collections) => {
	return collections.find((collection) =>
		collection.id.startsWith(queryObj[readingCollectionParam]),
	);
};

const fetchCollectionPubs = ({
	collectionId,
	communityId,
	offset = 0,
	limit = 10,
}: {
	collectionId: string;
	communityId: string;
	offset?: number;
	limit?: number;
}) => {
	const searchParams = new URLSearchParams();
	searchParams.append('collectionId', collectionId);
	searchParams.append('communityId', communityId);
	searchParams.append('offset', offset.toString());
	searchParams.append('limit', limit.toString());

	return apiFetch(`/api/collectionPubs?${searchParams.toString()}`);
};

export const getNeighborsInCollectionPub = (pubs, currentPub) => {
	if (!pubs) {
		return { previousPub: null, nextPub: null };
	}
	const currentIndex = pubs && pubs.indexOf(pubs.find((p) => p.id === currentPub.id));
	const previousPub = pubs && currentIndex > 0 && pubs[currentIndex - 1];
	const nextPub = pubs && currentIndex !== pubs.length - 1 && pubs[currentIndex + 1];
	return { previousPub, nextPub };
};

export const createReadingParamUrl = (url, collectionId) => {
	try {
		const urlObject = new URL(url);
		urlObject.searchParams.append(readingCollectionParam, collectionId.split('-')[0]);
		return urlObject.toString();
	} catch (err) {
		// on e.g. qubqub we don't know the actual origin, so we can't construct a URL object
		return `${url}?${readingCollectionParam}=${collectionId.split('-')[0]}`;
	}
};

export const chooseCollectionForPub = (pubData, locationData) => {
	const primaryCollection = getPrimaryCollection(pubData.collectionPubs);
	return (
		getCollectionFromReadingParam(
			locationData.query,
			pubData.collectionPubs.map((cp) => cp.collection),
		) || primaryCollection
	);
};

const DEFAULT_LIMIT = 10 as const;

export const useCollectionPubs = (updateLocalData, collection) => {
	const [error, setError] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [pubs, setPubs] = useState(collection?.pubs ?? []);
	const { communityData } = usePageContext();
	const [offset, setOffset] = useState(0);
	const [hasLoadedAllPubs, setHasLoadedAllPubs] = useState(false);

	const updatePubs = (nextPubs) => {
		setPubs((currentPubs) => [...currentPubs, ...nextPubs]);
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
			return { collectionPubs };
		});
	};

	const requestMorePubs = () => {
		if (hasLoadedAllPubs) {
			return;
		}
		setIsLoading(true);

		fetchCollectionPubs({
			collectionId: collection.id,
			communityId: communityData.id,
			offset,
		})
			.then((res) => {
				updatePubs(res);
				setIsLoading(false);
				setOffset((oldOffset) => oldOffset + DEFAULT_LIMIT);
				if (res.length < DEFAULT_LIMIT) {
					setHasLoadedAllPubs(true);
				}
			})
			.catch((err) => {
				setError(err);
				setIsLoading(false);
			});
	};

	return {
		isLoading,
		error,
		pubs,
		hasLoadedAllPubs,
		requestMorePubs,
	};
};
