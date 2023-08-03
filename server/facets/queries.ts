import { FacetBinding } from 'facets';
import { Pub, Collection } from 'server/models';
import { ScopeId } from 'types';

// A facetBinding has exactly one of { commnunityId, collectionId, pubId }. But some parts of our
// codebase like to have a communityId _plus_ an optional ID for a child scope -- this is useful
// e.g. for indexing a table by Community. So basically what this function does is looks up the
// Community associated with a FacetBinding if it's not already apparent.
export const getScopeIdForFacetBinding = async (facetBinding: FacetBinding): Promise<ScopeId> => {
	if (facetBinding.communityId) {
		return {
			communityId: facetBinding.communityId,
		};
	}
	if (facetBinding.pubId) {
		const pub = await Pub.findOne({ where: { id: facetBinding.pubId } });
		return {
			communityId: pub.communityId,
			pubId: pub.id,
		};
	}
	if (facetBinding.collectionId) {
		const collection = await Collection.findOne({
			where: { id: facetBinding.collectionId },
		});
		return {
			communityId: collection.communityId,
			collectionId: collection.id,
		};
	}
	throw new Error('FacetBinding has invalid IDs');
};
