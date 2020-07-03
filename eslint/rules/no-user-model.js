const errorMessage =
	'Using {model: User} may leak user data to the client. Use includeUserModel() from server/models.js instead.';

const propertyIsModelUser = (property) => {
	const { key, value } = property;
	if (key && value) {
		const keyIsModel =
			(key.type === 'Identifier' && key.name === 'model') ||
			(key.type === 'Literal' && key.value === 'model');
		return keyIsModel && value.name === 'User';
	}
	return false;
};

const checkObjectLiteral = (objectNode, context) => {
	const { properties } = objectNode;
	if (properties.some(propertyIsModelUser)) {
		context.report({
			message: errorMessage,
			node: objectNode,
		});
	}
};

module.exports = {
	meta: {
		type: 'problem',
		fixable: 'code',
	},
	create: (context) => {
		return {
			'ObjectExpression:exit': (node) => checkObjectLiteral(node, context),
		};
	},
};
