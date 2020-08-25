import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
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

const propTypes = {
	citationManager: PropTypes.object,
	/* Object of custom nodes. To remove default node, override. For example, { image: null, header: null } */
	// eslint-disable-next-line react/no-unused-prop-types
	customNodes: PropTypes.object,
	// eslint-disable-next-line react/no-unused-prop-types
	customMarks: PropTypes.object,
	/* All customPlugins values should be a function, which is passed schema and props - and returns a Plugin */
	customPlugins: PropTypes.object,
	collaborativeOptions: PropTypes.object,
	handleDoubleClick: PropTypes.func,
	handleSingleClick: PropTypes.func,
	// eslint-disable-next-line react/no-unused-prop-types
	initialContent: PropTypes.object,
	isReadOnly: PropTypes.bool,
	/* An object with nodeName keys and values of objects of overriding options. For example: nodeOptions = { image: { linkToSrc: false } } */
	// eslint-disable-next-line react/no-unused-prop-types
	nodeOptions: PropTypes.object,
	onChange: PropTypes.func,
	onError: PropTypes.func,
	onKeyPress: PropTypes.func,
	onScrollToSelection: PropTypes.func,
	placeholder: PropTypes.string,
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
	const staticContent = renderStatic({
		schema: schema,
		doc: props.initialContent,
		citationManager: citationManager,
	});
	return { schema: schema, initialDoc: initialDoc, staticContent: staticContent };
};

const Editor = (props) => {
	const editorRef = useRef();
	const initialArguments = useRef(null);

	if (initialArguments.current === null) {
		initialArguments.current = getInitialArguments(props);
	}

	useEffect(() => {
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
			ref={editorRef}
			className={`editor ProseMirror ${props.isReadOnly ? 'read-only' : ''}`}
		>
			{initialArguments.current.staticContent}
		</div>
	);
};

Editor.propTypes = propTypes;
Editor.defaultProps = defaultProps;
export default Editor;
