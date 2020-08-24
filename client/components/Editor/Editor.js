import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keydownHandler } from 'prosemirror-keymap';

import { getPlugins } from './plugins';
import { collabDocPluginKey } from './plugins/collaborative';
import { getChangeObject } from './plugins/onChange';
import { renderStatic, buildSchema } from './utils';
import nodeViews from './views';

require('./styles/base.scss');

const propTypes = {
	citationManager: PropTypes.object,
	/* Object of custom nodes. To remove default node, override. For example, { image: null, header: null } */
	customNodes: PropTypes.object,
	customMarks: PropTypes.object,
	/* All customPlugins values should be a function, which is passed schema and props - and returns a Plugin */
	customPlugins: PropTypes.object,
	collaborativeOptions: PropTypes.object,
	handleDoubleClick: PropTypes.func,
	handleSingleClick: PropTypes.func,
	initialContent: PropTypes.object,
	isReadOnly: PropTypes.bool,
	/* An object with nodeName keys and values of objects of overriding options. For example: nodeOptions = { image: { linkToSrc: false } } */
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

const StaticDoc = React.memo(({ schema, doc, citationManager }) =>
	renderStatic({ schema: schema, doc: doc, citationManager: citationManager }),
);

StaticDoc.propTypes = {
	citationManager: PropTypes.object,
	schema: PropTypes.object.isRequired,
	doc: PropTypes.shape({
		type: PropTypes.string,
		content: PropTypes.arrayOf(PropTypes.object),
	}).isRequired,
};

StaticDoc.defaultProps = {
	citationManager: null,
};

const Editor = (props) => {
	const editorRef = useRef();
	const schema = useRef(null);

	if (schema.current === null) {
		schema.current = buildSchema(props.customNodes, props.customMarks, props.nodeOptions);
	}

	useEffect(() => {
		const state = EditorState.create({
			doc: schema.current.nodeFromJSON(props.initialContent),
			schema: schema.current,
			plugins: getPlugins(schema.current, {
				citationManager: props.citationManager,
				collaborativeOptions: props.collaborativeOptions,
				customPlugins: props.customPlugins,
				initialContent: props.initialContent,
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
			<StaticDoc
				schema={schema.current}
				doc={props.initialContent}
				citationManager={props.citationManager}
			/>
		</div>
	);
};

Editor.propTypes = propTypes;
Editor.defaultProps = defaultProps;
export default Editor;
