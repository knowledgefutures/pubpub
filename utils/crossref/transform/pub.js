import { pubUrl } from 'utils/canonicalUrls';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { relationTypeDefinitions } from 'utils/pubEdge/relations';

import transformAttributions from './attributions';

function getIdentifierData(pubEdge, isInboundEdge) {
	const { externalPublication } = pubEdge;
	const targetPub = isInboundEdge ? pubEdge.pub : pubEdge.targetPub;

	let identifier;
	let identifierType;

	if (externalPublication) {
		const { doi, url } = externalPublication;

		identifier = doi || url;
		identifierType = doi ? 'doi' : 'uri';
	} else {
		const { doi, community } = targetPub;

		identifier = doi || pubUrl(community, targetPub);
		identifierType = doi ? 'doi' : 'uri';
	}

	return { identifier, identifierType };
}

function getEdgeCrossrefRelationship(pubEdge, isInboundEdge = false) {
	const { relationType, pubIsParent } = pubEdge;
	const { isIntraWork, crossrefRelationshipTypes } = relationTypeDefinitions[relationType];
	const crossrefRelationshipTypeIndex = +(isInboundEdge ? !pubIsParent : pubIsParent);
	const crossrefRelationshipType = crossrefRelationshipTypes[crossrefRelationshipTypeIndex];

	return {
		...getIdentifierData(pubEdge, isInboundEdge),
		isIntraWork,
		relationshipType: crossrefRelationshipType,
	};
}

export default ({ globals, community }) => (pub) => {
	const { timestamp, dois, contentVersion, reviewType, reviewRecommendation } = globals;
	const { title, inboundEdges, outboundEdges } = pub;
	const publicationDate = getPubPublishedDate(pub);
	const relatedItems = outboundEdges
		.map((pubEdge) => getEdgeCrossrefRelationship(pubEdge))
		.concat(inboundEdges.map((pubEdge) => getEdgeCrossrefRelationship(pubEdge, true)));

	return {
		title,
		timestamp,
		publicationDate,
		attributions: transformAttributions(pub.attributions),
		resourceUrl: pubUrl(community, pub),
		doi: dois.pub,
		relatedItems,
		contentVersion,
		reviewType,
		reviewRecommendation,
	};
};
