import { apiFetch } from 'utilities';

const API_ROOT = '/api/collectionPubs';

export default (collection, communityId) => ({
	addPubSelection: (pubId, rank) =>
		apiFetch(API_ROOT, {
			method: 'POST',
			body: JSON.stringify({
				pubId: pubId,
				collectionId: collection.id,
				communityId: communityId,
				rank: rank,
			}),
		}),
	updatePubSelection: (id, update) =>
		apiFetch(API_ROOT, {
			method: 'PUT',
			body: JSON.stringify({
				...update,
				id: id,
				collectionId: collection.id,
				communityId: communityId,
			}),
		}),
	deletePubSelection: (id) =>
		apiFetch(API_ROOT, {
			method: 'DELETE',
			body: JSON.stringify({
				id: id,
				collectionId: collection.id,
				communityId: communityId,
			}),
		}),
});
