import React, { useRef } from 'react';
import classNames from 'classnames';
import { MarkSpec, NodeSpec } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

import { CitationManager } from 'client/utils/citations/citationManager';

import { Doc, NodeLabelMap, CollaborativeOptions, PluginLoader } from './types';
import { getChangeObject } from './plugins/onChange';
import { getEmptyDoc, NodeReference } from './utils';
import { useSuggestions } from './hooks/useSuggestions';
import { useInitialValues } from './hooks/useInitialValues';
import { useEditorView } from './hooks/useEditorView';
import ReferenceFinder from './ReferenceFinder';

require('./styles/base.scss');

type Props = {
	citationManager?: CitationManager;
	collaborativeOptions?: CollaborativeOptions;
	customMarks?: Record<string, MarkSpec>;
	customNodes?: Record<string, NodeSpec>;
	customPlugins?: Record<string, null | PluginLoader>;
	initialContent?: Doc;
	isReadOnly?: boolean;
	nodeLabels?: NodeLabelMap;
	nodeOptions?: Record<string, any>;
	onChange?: (editorChangeObject: ReturnType<typeof getChangeObject>) => unknown;
	onError?: (err: Error) => unknown;
	onKeyPress?: (view: EditorView, evt: KeyboardEvent) => boolean;
	onScrollToSelection?: (view: EditorView) => boolean;
	placeholder?: string;
};

const emptyDoc = getEmptyDoc();

const Editor = (props: Props) => {
	const {
		nodeLabels = {} as NodeLabelMap,
		citationManager,
		collaborativeOptions,
		customMarks = {},
		customNodes = {},
		customPlugins = {},
		initialContent = emptyDoc,
		isReadOnly = false,
		nodeOptions = {},
		onChange,
		onError,
		onKeyPress,
		onScrollToSelection,
		placeholder = '',
	} = props;

	const mountRef = useRef<HTMLDivElement | null>(null);
	const { suggesting, suggestionManager } = useSuggestions<NodeReference>();

	const { initialDocNode, schema, staticContent } = useInitialValues({
		nodeLabels: nodeLabels,
		nodeOptions: nodeOptions,
		citationManager: citationManager,
		customNodes: customNodes,
		customMarks: customMarks,
		initialContent: initialContent,
		isReadOnly: isReadOnly,
	});

	useEditorView({
		customPlugins: customPlugins,
		pluginsOptions: {
			citationManager: citationManager,
			collaborativeOptions: collaborativeOptions,
			isReadOnly: isReadOnly,
			nodeLabels: nodeLabels,
			onChange: onChange,
			onError: onError,
			placeholder: placeholder,
			suggestionManager: suggestionManager,
		},
		initialDocNode: initialDocNode,
		schema: schema,
		isReadOnly: isReadOnly,
		onKeyPress: onKeyPress,
		onScrollToSelection: onScrollToSelection,
		onError: onError,
		mountRef: mountRef,
	});

	return (
		<>
			<div
				ref={mountRef}
				className={classNames('editor', 'ProseMirror', isReadOnly && 'read-only')}
			>
				{staticContent}
			</div>
			{suggesting && (
				<div style={suggestionManager.getPosition()}>
					<ReferenceFinder
						nodeLabels={nodeLabels}
						references={suggesting.items}
						activeReference={suggestionManager.getSelectedValue()}
						onReferenceSelect={(reference) => suggestionManager.select(reference)}
					/>
				</div>
			)}
		</>
	);
};

export default Editor;
