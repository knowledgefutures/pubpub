export const relationTypeDefinitions = {
	comment: {
		label: 'comment',
		childRelationString: 'is a comment on',
		parentRelationString: 'is commented on by',
	},
	preprint: {
		label: 'preprint',
		childRelationString: 'is a preprint of',
		parentRelationString: 'has preprint',
	},
	reply: {
		label: 'reply',
		childRelationString: 'is a reply to',
		parentRelationString: 'is replied to by',
	},
	review: {
		label: 'review',
		childRelationString: 'is a review of',
		parentRelationString: 'is reviewed by',
	},
	supplement: {
		label: 'supplement',
		childRelationString: 'is a supplement to',
		parentRelationString: 'is supplemented by',
	},
	translation: {
		label: 'translation',
		childRelationString: 'is a translation of',
		parentRelationString: 'is translated to another language in',
	},
	version: {
		label: 'version',
		childRelationString: 'is a version of',
		parentRelationString: 'has another version in',
	},
};

export const relationTypes = Object.keys(relationTypeDefinitions);
