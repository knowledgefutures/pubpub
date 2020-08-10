import { toTitleCase } from 'utils/strings';

export const relationTypeDefinitions = {
	comment: {
		name: 'Comment',
		article: 'a',
		preposition: 'on',
		isIntraWork: false,
		crossrefRelationshipTypes: ['isCommentOn', 'hasComment'],
	},
	commentary: {
		name: 'Commentary',
		plural: 'Commentaries',
		article: 'a',
		preposition: 'on',
		isIntraWork: false,
		crossrefRelationshipTypes: ['isCommentOn', 'hasComment'],
	},
	preprint: {
		name: 'Preprint',
		article: 'a',
		preposition: 'of',
		isIntraWork: true,
		crossrefRelationshipTypes: ['isPreprintOf', 'hasPreprint'],
	},
	rejoinder: {
		name: 'Rejoinder',
		article: 'a',
		preposition: 'to',
		isIntraWork: false,
		crossrefRelationshipTypes: ['isReplyTo', 'hasReply'],
	},
	reply: {
		name: 'Reply',
		plural: 'Replies',
		article: 'a',
		preposition: 'to',
		isIntraWork: false,
		crossrefRelationshipTypes: ['isReplyTo', 'hasReply'],
	},
	review: {
		name: 'Review',
		article: 'a',
		preposition: 'of',
		isIntraWork: false,
		crossrefRelationshipTypes: ['isReviewOf', 'hasReview'],
	},
	supplement: {
		name: 'Supplement',
		article: 'a',
		preposition: 'to',
		isIntraWork: false,
		crossrefRelationshipTypes: ['isSupplementTo', 'isSupplementedBy'],
	},
	translation: {
		name: 'Translation',
		article: 'a',
		preposition: 'of',
		isIntraWork: true,
		crossrefRelationshipTypes: ['isTranslationOf', 'hasTranslation'],
	},
	version: {
		name: 'Version',
		article: 'a',
		preposition: 'of',
		isIntraWork: true,
		crossrefRelationshipTypes: ['isVersionOf', 'hasVersion'],
	},
};

const createRelationTypeEnum = () => {
	const res = {};
	Object.entries(relationTypeDefinitions).forEach(([key]) => {
		res[toTitleCase(key)] = key;
	});
	return res;
};

export const getRelationTypeName = (relationType, isPlural) => {
	const definition = relationTypeDefinitions[relationType];
	if (definition) {
		const { name, plural } = definition;
		if (isPlural) {
			return plural || `${name}s`;
		}
		return name;
	}
	return null;
};

export const relationTypes = Object.keys(relationTypeDefinitions);
export const RelationType = createRelationTypeEnum();

const findParentEdge = (pubEdges, validRelationTypes, inbound) => {
	for (let i = 0; i < pubEdges.length; i++) {
		const pubEdge = pubEdges[i];
		const { pubIsParent, relationType } = pubEdge;

		if (inbound ? pubIsParent : !pubIsParent) {
			for (let j = 0; j < validRelationTypes.length; j++) {
				if (relationType === validRelationTypes[j]) {
					return pubEdge;
				}
			}
		}
	}

	return null;
};

export const findParentEdgeByRelationTypes = (pub, validRelationTypes) => {
	const { inboundEdges, outboundEdges } = pub;

	return (
		findParentEdge(inboundEdges, validRelationTypes, true) ||
		findParentEdge(outboundEdges, validRelationTypes) ||
		null
	);
};
