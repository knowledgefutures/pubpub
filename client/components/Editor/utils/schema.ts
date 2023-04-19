import { Schema } from 'prosemirror-model';

import { mapObject } from 'utils/objects';
import { defaultNodes, defaultMarks } from 'components/Editor/schemas';
import {
	marks as suggestedEditMarks,
	amendNodeSpecWithSuggestedEdits,
} from 'components/Editor/plugins/suggestedEdits/schema';

export const buildSchema = (customNodes = {}, customMarks = {}) => {
	const schemaNodes = mapObject(
		{
			...defaultNodes,
			...customNodes,
		},
		(nodeSpec, nodeKey) => amendNodeSpecWithSuggestedEdits(nodeKey, nodeSpec),
	);

	const schemaMarks = {
		...defaultMarks,
		...customMarks,
		...suggestedEditMarks,
	};

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

export const editorSchema = buildSchema();
