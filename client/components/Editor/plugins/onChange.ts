import { Plugin, NodeSelection, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { isInTable } from 'prosemirror-tables';
import { getReactedCopyOfNode } from '@pubpub/prosemirror-reactive';

import { PluginsOptions } from '../types';
import { collabDocPluginKey } from './collaborative';
import { domEventsPluginKey } from './domEvents';

const changePluginKey = new PluginKey('onChange');

const getRangeBoundingBox = (editorView, fromPos, toPos) => {
	const fromBoundingBox = editorView.coordsAtPos(fromPos);
	const toBoundingBox = editorView.coordsAtPos(toPos);
	return {
		left: Math.min(fromBoundingBox.left, toBoundingBox.left),
		top: Math.min(fromBoundingBox.top, toBoundingBox.top),
		right: Math.max(fromBoundingBox.right, toBoundingBox.right),
		bottom: Math.max(fromBoundingBox.bottom, toBoundingBox.bottom),
	};
};

const getDecorations = (editorView) => {
	const decorationSets = editorView.docView.innerDeco.members
		? editorView.docView.innerDeco.members
		: [editorView.docView.innerDeco];

	return decorationSets.reduce((prev, curr) => {
		const decorations = curr.find().map((decoration) => {
			return {
				from: decoration.from,
				to: decoration.to,
				boundingBox: getRangeBoundingBox(editorView, decoration.from, decoration.to),
				attrs: decoration.type.attrs,
			};
		});
		return [...prev, ...decorations];
	}, []);
};

const getActiveLink = (editorView) => {
	const editorState = editorView.state;
	const linkMarkType = editorState.schema.marks.link;
	const { from, $from, to, $to, empty } = editorState.selection;
	const shiftedFrom = editorState.doc.resolve(Math.max(from - 1, 0));
	const shiftedTo = editorState.doc.resolve(Math.max(to - 1, 0));

	/* Because we set link marks to not be inclusive, we need to do */
	/* some shifted so the dialog will appear at the start and end */
	/* of the link text */
	const getMarks = (open, close) => {
		return open.marksAcross(close) || [];
	};

	/* eslint-disable-next-line no-nested-ternary */
	const foundMarks = empty
		? getMarks($from, $to).length
			? getMarks($from, $to)
			: getMarks(shiftedFrom, shiftedTo)
		: getMarks($from, shiftedTo);

	const activeLinkMark = foundMarks.reduce((prev, curr) => {
		if (curr.type.name === 'link') {
			return curr;
		}
		return prev;
	}, undefined);

	if (!activeLinkMark) {
		return undefined;
	}

	/* Note - this start and end will cause directly adjacent */
	/* links to be merged into a single link on edit. Adjacent */
	/* links with different URLs seems like a worse UI experience */
	/* than having two links merge on edit. So, perhaps we simply */
	/* leave this 'bug'. We can revisit later. */
	let startPos = from - 1;
	let foundStart = false;
	while (!foundStart) {
		if (startPos === 0) {
			foundStart = true;
		}
		if (editorState.doc.rangeHasMark(startPos, startPos + 1, linkMarkType)) {
			startPos -= 1;
		} else {
			foundStart = true;
		}
	}
	let endPos = from;
	let foundEnd = false;
	while (!foundEnd) {
		if (endPos === 0) {
			foundEnd = true;
		}
		if (editorState.doc.rangeHasMark(endPos, endPos + 1, linkMarkType)) {
			endPos += 1;
		} else {
			foundEnd = true;
		}
	}

	return {
		attrs: activeLinkMark.attrs,
		boundingBox: getRangeBoundingBox(editorView, startPos, endPos),
		updateAttrs: (newAttrs) => {
			const oldNodeAttrs = activeLinkMark.attrs;
			const transaction = editorView.state.tr;
			transaction.removeMark(startPos + 1, endPos, editorView.state.schema.marks.link);
			transaction.addMark(
				startPos + 1,
				endPos,
				editorView.state.schema.marks.link.create({ ...oldNodeAttrs, ...newAttrs }),
			);
			editorView.dispatch(transaction);
		},
		removeLink: () => {
			const transaction = editorView.state.tr;
			transaction.removeMark(startPos + 1, endPos, editorView.state.schema.marks.link);
			editorView.dispatch(transaction);
		},
	};
};

const updateAttrs = (isNode, editorView) => {
	if (!isNode) {
		return undefined;
	}

	return (newAttrs) => {
		const start = editorView.state.selection.from;
		if (start !== undefined) {
			const oldNodeAttrs = editorView.state.selection.node.attrs;
			const transaction = editorView.state.tr.setNodeMarkup(
				start,
				null,
				{
					...oldNodeAttrs,
					...newAttrs,
				},
				editorView.state.selection.node.marks,
			);
			if (editorView.state.selection.node.type.isInline) {
				/* Inline nodeviews lose focus on content change */
				/* this fixes that issue. */
				const sel = NodeSelection.create(transaction.doc, start);
				transaction.setSelection(sel);
			}
			editorView.dispatch(transaction);
		}
	};
};

const changeNode = (isNode, editorView) => {
	if (!isNode) {
		return undefined;
	}
	return (nodeType, attrs, content) => {
		const newNode = nodeType.create({ ...attrs }, content);
		const start = editorView.state.selection.from;
		const end = editorView.state.selection.to;
		const transaction = editorView.state.tr.replaceRangeWith(start, end, newNode);
		editorView.dispatch(transaction);
		// this.view.focus();
		/* Changing a node between inline and block will cause it to lose focus */
		/* Attempting to regain that focus seems difficult due to the fuzzy nature */
		/* of replaceRangeWith. For the moment, changing from inline to block will */
		/* simply result in losing focus. */
	};
};

const getSelectedNode = (editorState) => {
	const node = editorState.selection.node;
	return getReactedCopyOfNode(node, editorState) || node;
};

export const getChangeObject = (editorView: EditorView) => {
	const isNode = !!(editorView.state.selection as any).node;
	const collaborativePluginState = collabDocPluginKey.getState(editorView.state) || {};
	const { latestDomEvent } = domEventsPluginKey.getState(editorView.state);
	return {
		/* The current editor view. */
		// view: {
		// 	state: editorView.state,
		// 	dispatch: editorView.dispatch,
		// 	hasFocus: () => {
		// 		return hasFocus;
		// 	},
		// },
		view: editorView,
		/* The active selection. */
		selection: editorView.state.selection,
		/* The bounding box for the active selection. */
		selectionBoundingBox: getRangeBoundingBox(
			editorView,
			editorView.state.selection.from,
			editorView.state.selection.to,
		),
		/* boolean indicating whether the selection is in a table */
		selectionInTable: isInTable(editorView.state),
		/* If the active selection is of a NodeView, provide the selected node. */
		selectedNode: isNode ? getSelectedNode(editorView.state) : undefined,
		/* If the active selection is of a NodeView, provide a function to update the selected node. */
		/* The updateNode function expects an object of attrs as its sole input */
		updateNode: updateAttrs(isNode, editorView),
		/* If the active selection is of a NodeView, provide a function to change the selected node. */
		changeNode: changeNode(isNode, editorView),
		/* The full list of decorations and their bounding boxes */
		decorations: getDecorations(editorView),
		/* activeLink is useful for displaying a link editing interface. */
		activeLink: getActiveLink(editorView),
		/* boolean alerting whether the collab plugin has finished loading */
		isCollabLoaded: collaborativePluginState.isLoaded,
		latestDomEvent,
	};
};

export const immediatelyDispatchOnChange = (view: EditorView) => {
	return changePluginKey.getState(view.state)?.dispatchChange(view);
};

export default (_, props: PluginsOptions) => {
	const dispatchChange = (editorView: EditorView) => {
		props.onChange?.(getChangeObject(editorView));
	};

	return new Plugin({
		key: changePluginKey,
		state: {
			init: () => {
				return {
					dispatchChange,
				};
			},
			apply: (__, s) => s,
		},
		view: () => {
			return {
				update: dispatchChange,
			};
		},
	});
};
