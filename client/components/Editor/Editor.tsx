import React, { useRef } from 'react';
import classNames from 'classnames';
import { MarkSpec, NodeSpec } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

import { CitationManager } from 'client/utils/citations/citationManager';
import { DocJson, Maybe } from 'utils/types';

import {
	CollaborativeOptions,
	DiscussionsOptions,
	EditorChangeObject,
	NodeLabelMap,
	OnEditFn,
	PluginLoader,
} from './types';
import { getEmptyDoc, NodeReference } from './utils';
import { useSuggestions } from './hooks/useSuggestions';
import { useInitialValues } from './hooks/useInitialValues';
import { useEditorView } from './hooks/useEditorView';
import ReferenceFinder from './ReferenceFinder';

require('./styles/base.scss');

type Props = {
	citationManager?: CitationManager;
	collaborativeOptions?: CollaborativeOptions;
	discussionsOptions?: Maybe<DiscussionsOptions>;
	customMarks?: Record<string, MarkSpec>;
	customNodes?: Record<string, NodeSpec>;
	customPlugins?: Record<string, null | PluginLoader>;
	enableSuggestions?: boolean;
	initialContent?: DocJson;
	isReadOnly?: boolean;
	nodeLabels?: NodeLabelMap;
	nodeOptions?: Record<string, any>;
	onEdit?: OnEditFn;
	onChange?: (editorChangeObject: EditorChangeObject) => unknown;
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
		discussionsOptions,
		enableSuggestions = false,
		initialContent = emptyDoc,
		isReadOnly = false,
		nodeOptions = {},
		onChange,
		onError,
		onEdit,
		onKeyPress,
		onScrollToSelection,
		placeholder,
	} = props;

	const mountRef = useRef<HTMLDivElement | null>(null);
	const { suggesting, suggestionManager } = useSuggestions<NodeReference>(enableSuggestions);

	const { initialDocNode, schema, staticContent } = useInitialValues({
		nodeLabels,
		nodeOptions,
		citationManager,
		customNodes,
		customMarks,
		initialContent,
		isReadOnly,
	});

	useEditorView({
		customPlugins,
		pluginsOptions: {
			citationManager,
			discussionsOptions: discussionsOptions || null,
			collaborativeOptions,
			initialDoc: initialDocNode,
			isReadOnly,
			nodeLabels,
			onChange,
			onError,
			placeholder,
			suggestionManager,
		},
		initialDocNode,
		schema,
		isReadOnly,
		onKeyPress,
		onScrollToSelection,
		onError,
		onEdit,
		mountRef,
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
