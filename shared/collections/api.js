const findRankForSelection = (selections, index) =>
	findRank(
		selections.map((s) => s.rank),
		index,
    );
    
    import { apiFetch } from 'utils';


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
