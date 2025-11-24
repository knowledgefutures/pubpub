import type { Pub, PubEdge } from 'types';

import type { AnyResource, Resource } from './resource';

import { RelationType } from 'utils/pubEdge';
import { findParentEdgeByRelationTypes } from 'utils/pubEdge/relations';

function filterForMutuallyApprovedEdges(pubEdges: PubEdge[]) {
	let i = 0;
	while (i < pubEdges.length) {
		const { approvedByTarget, relationType, externalPublicationId } = pubEdges[i];
		if (
			(relationType === RelationType.Supplement || relationType === RelationType.Preprint) &&
			// We don't filter external publication connections since they cannot be
			// approved (they exist off PubPub).
			!externalPublicationId &&
			!approvedByTarget
		) {
			pubEdges.splice(i, 1);
		} else {
			i++;
		}
	}
}

export function getPrimaryParentPubEdge(pub: Pub) {
	if (pub.inboundEdges && pub.outboundEdges) {
		// Find the primary relationship (in order of Preprint > Supplement > Review).
		return findParentEdgeByRelationTypes(pub, [
			RelationType.Preprint,
			RelationType.Supplement,
			RelationType.Review,
			RelationType.Rejoinder,
		]);
	}
	return null;
}

export function sanitizePubEdges<T extends Pub>(pub: T, includeRelationships: boolean): T {
	// @ts-ignore

	pub = structuredClone(pub);
	if (pub.inboundEdges && pub.outboundEdges) {
		// Remove unapproved PubEdges for RelationTypes that require bidirectional
		// approval.
		filterForMutuallyApprovedEdges(pub.inboundEdges);
		filterForMutuallyApprovedEdges(pub.outboundEdges);
		if (!includeRelationships) {
			pub.inboundEdges = [];
			pub.outboundEdges = [];
		}
	}
	return pub;
}

export function isFullResource(resource: AnyResource): resource is Resource {
	return 'title' in resource;
}
