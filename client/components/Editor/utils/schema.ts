import { Schema } from 'prosemirror-model';

import { defaultNodes, defaultMarks } from 'components/Editor/schemas';

export const buildSchema = (customNodes = {}, customMarks = {}, nodeOptions = {}) => {
	const schemaNodes = {
		...defaultNodes,
		...customNodes,
	};
	const schemaMarks = {
		...defaultMarks,
		...customMarks,
	};

	/* Overwrite defaultOptions with custom supplied nodeOptions */
	Object.keys(nodeOptions).forEach((nodeKey) => {
		const nodeSpec = schemaNodes[nodeKey];
		if (nodeSpec) {
			schemaNodes[nodeKey].defaultOptions = {
				...nodeSpec.defaultOptions,
				...nodeOptions[nodeKey],
			};
		}
	});

	/* Filter out undefined (e.g. overwritten) nodes and marks */
	Object.keys(schemaNodes).forEach((nodeKey) => {
		if (!schemaNodes[nodeKey]) {
			delete schemaNodes[nodeKey];
		}
	});
	Object.keys(schemaMarks).forEach((markKey) => {
		if (!schemaMarks[markKey]) {
			delete schemaMarks[markKey];
		}
	});

	return new Schema({
		nodes: schemaNodes,
		marks: schemaMarks,
		topNode: 'doc',
	});
};
