import { MarkSpec, Node, NodeSpec, Schema } from 'prosemirror-model';
import { useRef } from 'react';
import { addTemporaryIdsToDoc } from '@pubpub/prosemirror-reactive';

import { NoteManager } from 'client/utils/notes';
import { DocJson } from 'types';

import { NodeLabelMap } from '../types';
import { buildSchema, renderStatic } from '../utils';

type InitialValues = {
	initialDocNode: Node;
	staticContent: ReturnType<typeof renderStatic>;
	schema: Schema;
};

type InitialValuesOptions = {
	noteManager?: NoteManager;
	customNodes: Record<string, NodeSpec>;
	customMarks: Record<string, MarkSpec>;
	nodeLabels: NodeLabelMap;
	initialContent: DocJson;
	isReadOnly: boolean;
};

const getInitialOptions = (options: InitialValuesOptions) => {
	const { nodeLabels, noteManager, customMarks, customNodes, initialContent, isReadOnly } =
		options;
	const schema = buildSchema(customNodes, customMarks);
	const hydratedDoc = schema.nodeFromJSON(initialContent);
	const initialDocNode = isReadOnly ? addTemporaryIdsToDoc(hydratedDoc) : hydratedDoc;
	const staticContent = renderStatic({
		schema,
		doc: initialContent,
		nodeLabels,
		noteManager,
	});
	return { schema, initialDocNode, staticContent };
};

export const useInitialValues = (options: InitialValuesOptions) => {
	const initialValuesRef = useRef<null | InitialValues>(null);

	if (initialValuesRef.current === null) {
		initialValuesRef.current = getInitialOptions(options);
	}

	return initialValuesRef.current!;
};
