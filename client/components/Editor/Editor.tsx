import React, { useEffect, useRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keydownHandler } from 'prosemirror-keymap';
import { addTemporaryIdsToDoc } from '@pubpub/prosemirror-reactive';

import { getPlugins } from './plugins';
import { collabDocPluginKey } from './plugins/collaborative';
import { getChangeObject } from './plugins/onChange';
import { renderStatic, buildSchema } from './utils';
import nodeViews from './views';

require('./styles/base.scss');

type OwnProps = {
	citationManager?: any;
	customNodes?: any;
	customMarks?: any;
	customPlugins?: any;
	collaborativeOptions?: any;
	handleDoubleClick?: (...args: any[]) => any;
	handleSingleClick?: (...args: any[]) => any;
	initialContent?: any;
	isReadOnly?: boolean;
	nodeOptions?: any;
	onChange?: (...args: any[]) => any;
	onError?: (...args: any[]) => any;
	onKeyPress?: (...args: any[]) => any;
	onScrollToSelection?: (...args: any[]) => any;
	placeholder?: string;
};

const defaultProps = {
	citationManager: null,
	collaborativeOptions: {},
	customMarks: {}, // defaults: 'em', 'strong', 'link', 'sub', 'sup', 'strike', 'code'
	customNodes: {}, // defaults: 'blockquote', 'horizontal_rule', 'heading', 'ordered_list', 'bullet_list', 'list_item', 'code_block', 'text', 'hard_break', 'image'
	customPlugins: {}, // defaults: inputRules, keymap, headerIds, placeholder
	handleDoubleClick: undefined,
	handleSingleClick: undefined,
	initialContent: { type: 'doc', attrs: { meta: {} }, content: [{ type: 'paragraph' }] },
	isReadOnly: false,
	nodeOptions: {},
	onChange: () => {},
	onError: () => {},
	onKeyPress: () => {},
	onScrollToSelection: undefined,
	placeholder: '',
};

const getInitialArguments = (props) => {
	const {
		citationManager,
		customMarks,
		customNodes,
		initialContent,
		isReadOnly,
		nodeOptions,
	} = props;
	const schema = buildSchema(customNodes, customMarks, nodeOptions);
	const hydratedDoc = schema.nodeFromJSON(initialContent);
	const initialDoc = isReadOnly ? addTemporaryIdsToDoc(hydratedDoc) : hydratedDoc;
	// @ts-expect-error ts-migrate(2345) FIXME: Property 'reactedDoc' is missing in type '{ schema... Remove this comment to see the full error message
	const staticContent = renderStatic({
		schema: schema,
		doc: props.initialContent,
		citationManager: citationManager,
	});
	return { schema: schema, initialDoc: initialDoc, staticContent: staticContent };
};

type Props = OwnProps & typeof defaultProps;

const Editor = (props: Props) => {
	const editorRef = useRef();
	const initialArguments = useRef(null);

	if (initialArguments.current === null) {
		// @ts-expect-error ts-migrate(2322) FIXME: Type '{ schema: any; initialDoc: any; staticConten... Remove this comment to see the full error message
		initialArguments.current = getInitialArguments(props);
	}

	useEffect(() => {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'initialDoc' does not exist on type 'null... Remove this comment to see the full error message
		const { initialDoc, schema } = initialArguments.current;
		const state = EditorState.create({
			doc: initialDoc,
			schema: schema,
			plugins: getPlugins(schema, {
				citationManager: props.citationManager,
				collaborativeOptions: props.collaborativeOptions,
				customPlugins: props.customPlugins,
				isReadOnly: props.isReadOnly,
				onChange: props.onChange,
				onError: props.onError,
				placeholder: props.placeholder,
			}),
		});

		const view = new EditorView(
			{ mount: editorRef.current },
			{
				state: state,
				nodeViews: nodeViews,
				editable: (editorState) => {
					const collaborativePluginState = collabDocPluginKey.getState(editorState) || {};
					if (
						props.collaborativeOptions.clientData &&
						!collaborativePluginState.isLoaded
					) {
						return false;
					}
					return !props.isReadOnly;
				},
				handleKeyDown: keydownHandler({
					/* Block Ctrl-S from launching the browser Save window */
					'Mod-s': () => {
						return true;
					},
				}),
				handleKeyPress: props.onKeyPress,
				handleClickOn: props.handleSingleClick,
				handleDoubleClickOn: props.handleDoubleClick,
				handleScrollToSelection: props.onScrollToSelection,
			},
		);
		// Sometimes the view will call its dispatchTransaction from the constructor, but the
		// function itself references the `view` variable bound above. So we need to set this
		// prop immediately after it's constructed.
		view.setProps({
			dispatchTransaction: (transaction) => {
				try {
					const newState = view.state.apply(transaction);
					const transactionHasSteps = transaction.steps.length;
					view.updateState(newState);
					if (props.collaborativeOptions.firebaseRef && transactionHasSteps) {
						collabDocPluginKey.getState(newState).sendCollabChanges(newState);
					}
				} catch (err) {
					console.error('Error applying transaction:', err);
					props.onError(err);
				}
			},
		});
		props.onChange(getChangeObject(view));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/* Before createEditor is called from componentDidMount, we */
	/* generate a static version of the doc for server-side rendering. */
	/* This static version is overwritten when the editorView is */
	/* mounted into the editor dom node. */

	return (
		<div
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'HTMLDi... Remove this comment to see the full error message
			ref={editorRef}
			className={`editor ProseMirror ${props.isReadOnly ? 'read-only' : ''}`}
		>
			{/* @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'. */}
			{initialArguments.current.staticContent}
		</div>
	);
};
Editor.defaultProps = defaultProps;
export default Editor;
