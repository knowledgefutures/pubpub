import { toTitleCase } from 'utils/strings';

export const relationTypeDefinitions = {
	comment: {
		name: 'Comment',
		article: 'a',
		preposition: 'on',
	},
	commentary: {
		name: 'Commentary',
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
		preposition: 'of',
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

export const relationTypes = Object.keys(relationTypeDefinitions);
export const RelationType = createRelationTypeEnum();
