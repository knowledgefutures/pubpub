import { MarkSpec, Node, NodeSpec, Schema } from 'prosemirror-model';
import { useRef } from 'react';
import { addTemporaryIdsToDoc } from '@pubpub/prosemirror-reactive';

import { CitationManager } from 'client/utils/citations/citationManager';

import { Doc, NodeLabelMap } from '../types';
import { buildSchema, renderStatic } from '../utils';

type InitialValues = {
	initialDocNode: Node;
	staticContent: ReturnType<typeof renderStatic>;
	schema: Schema;
};

type InitialValuesOptions = {
	citationManager?: CitationManager;
	customNodes: Record<string, NodeSpec>;
	customMarks: Record<string, MarkSpec>;
	nodeLabels: NodeLabelMap;
	initialContent: Doc;
	isReadOnly: boolean;
	nodeOptions: Record<string, any>;
};

const getInitialOptions = (options: InitialValuesOptions) => {
	const {
		nodeLabels,
		citationManager,
		customMarks,
		customNodes,
		initialContent,
		isReadOnly,
		nodeOptions,
	} = options;
	const schema = buildSchema(customNodes, customMarks, nodeOptions);
	const hydratedDoc = schema.nodeFromJSON(initialContent);
	const initialDocNode = isReadOnly ? addTemporaryIdsToDoc(hydratedDoc) : hydratedDoc;
	const staticContent = renderStatic({
		schema: schema,
		doc: initialContent,
		nodeLabels: nodeLabels,
		citationManager: citationManager,
	});
	return { schema: schema, initialDocNode: initialDocNode, staticContent: staticContent };
};

export const useInitialValues = (options: InitialValuesOptions) => {
	const initialValuesRef = useRef<null | InitialValues>(null);

	if (initialValuesRef.current === null) {
		initialValuesRef.current = getInitialOptions(options);
	}

	return initialValuesRef.current!;
};
