import { toTitleCase } from 'utils/strings';

export const relationTypeDefinitions = {
	comment: {
		name: 'Comment',
		article: 'a',
		preposition: 'on',
	},
	commentary: {
		name: 'Commentary',
		plural: 'Commentaries',
		article: 'a',
		preposition: 'on',
	},
	preprint: {
		name: 'Preprint',
		article: 'a',
		preposition: 'of',
	},
	rejoinder: {
		name: 'Rejoinder',
		article: 'a',
		preposition: 'to',
	},
	reply: {
		name: 'Reply',
		plural: 'Replies',
		article: 'a',
		preposition: 'to',
	},
	review: {
		name: 'Review',
		article: 'a',
		preposition: 'of',
	},
	supplement: {
		name: 'Supplement',
		article: 'a',
		preposition: 'to',
	},
	translation: {
		name: 'Translation',
		article: 'a',
		preposition: 'of',
	},
	version: {
		name: 'Version',
		article: 'a',
		preposition: 'of',
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
