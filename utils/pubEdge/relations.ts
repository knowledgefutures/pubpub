import { PubEdge } from 'types/pubEdge';
import { sortByRank } from 'utils/rank';
import { toTitleCase } from 'utils/strings';
import type { TuplifyUnion } from 'utils/types';

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
} as const;

type RelationTypeDefs = TuplifyUnion<keyof typeof relationTypeDefinitions>;

type TitleCasedRelationTypeDefinitions = {
	[K in keyof typeof relationTypeDefinitions as `${Capitalize<K>}`]: K;
};

const createRelationTypeEnum = () => {
	const res = {} as TitleCasedRelationTypeDefinitions;
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

export const relationTypes = Object.keys(relationTypeDefinitions) as RelationTypeDefs;
export type RelationTypeName = (typeof relationTypes)[number];
export const RelationType = createRelationTypeEnum();

const findParentEdge = (pubEdges: PubEdge[], validRelationTypes, inbound = false) => {
	const sortedPubEdges = sortByRank(pubEdges);

	for (let i = 0; i < sortedPubEdges.length; i++) {
		const pubEdge = sortedPubEdges[i];
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
