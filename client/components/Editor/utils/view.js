import { Selection } from 'prosemirror-state';
import { Node, Slice } from 'prosemirror-model';

export const dispatchEmptyTransaction = (editorView) => {
	const emptyInitTransaction = editorView.state.tr;
	editorView.dispatch(emptyInitTransaction);
};

export const getJSON = (editorView) => {
	if (!editorView) {
		return null;
	}
	return editorView.state.doc.toJSON();
};

export const getText = (editorView, separator = '\n') => {
	if (!editorView) {
		return null;
	}
	return editorView.state.doc.textBetween(0, editorView.state.doc.nodeSize - 2, separator);
};

export const getCollabJSONs = (editorView, collabIds) => {
	const collabPlugin = editorView.state.plugins.reduce((prev, curr) => {
		if (curr.key === 'collaborative$') {
			return curr;
		}
		return prev;
	}, undefined);

	return collabPlugin ? collabPlugin.getJSONs(collabIds) : null;
};

export const importDocJson = (editorView, docJson) => {
	const doc = Node.fromJSON(editorView.state.schema, docJson);
	const tr = editorView.state.tr;
	tr.setSelection(Selection.atStart(editorView.state.doc));
	tr.replaceSelection(new Slice(doc.content, 0, 0));
	editorView.dispatch(tr);
	return doc;
};

export const formatDiscussionData = (editorView, from, to) => {
	const collabPlugin = editorView.state.collaborative$ || {};
	const remoteKey = collabPlugin.mostRecentRemoteKey;
	return {
		currentKey: remoteKey,
		initAnchor: from,
		initHead: to,
		initKey: remoteKey,
		selection: {
			a: from,
			h: to,
			type: 'text',
		},
	};
};

export const setLocalHighlight = (editorView, from, to, id) => {
	const transaction = editorView.state.tr;
	transaction.setMeta('localHighlights', true);
	transaction.setMeta('newLocalHighlightData', [
		{
			from: from,
			to: to,
			id: id,
		},
	]);
	editorView.dispatch(transaction);
};

export const removeLocalHighlight = (editorView, id) => {
	const transaction = editorView.state.tr;
	transaction.setMeta('localHighlights', true);
	transaction.setMeta('localHighlightIdToRemove', id);
	editorView.dispatch(transaction);
};

export const convertLocalHighlightToDiscussion = (editorView, highlightId, firebaseRef) => {
	const localHighlight = editorView.state.localHighlights$.activeDecorationSet
		.find()
		.filter((decoration) => {
			return decoration.type.attrs && decoration.type.attrs.class;
		})
		.reduce((prev, curr) => {
			const decorationId = curr.type.attrs.class.replace('local-highlight lh-', '');
			if (decorationId === highlightId) {
				return curr;
			}
			return prev;
		}, {});
	const newDiscussionData = formatDiscussionData(
		editorView,
		localHighlight.from,
		localHighlight.to,
	);
	removeLocalHighlight(editorView, highlightId);
	return firebaseRef
		.child('discussions')
		.child(highlightId)
		.set(newDiscussionData);
};

export const getLocalHighlightText = (editorView, highlightId) => {
	const localHighlight = editorView.state.localHighlights$.activeDecorationSet
		.find()
		.filter((decoration) => {
			return decoration.type.attrs && decoration.type.attrs.class;
		})
		.reduce((prev, curr) => {
			const decorationId = curr.type.attrs.class.replace('local-highlight lh-', '');
			if (decorationId === highlightId) {
				return curr;
			}
			return prev;
		}, undefined);
	if (!localHighlight) {
		return null;
	}

	const fromPos = localHighlight.from;
	const toPos = localHighlight.to;
	const exact = editorView.state.doc.textBetween(fromPos, toPos);
	const contextLength = 100;
	const prefix = editorView.state.doc.textBetween(
		Math.max(0, fromPos - contextLength),
		Math.max(0, fromPos),
	);
	const suffix = editorView.state.doc.textBetween(
		Math.min(editorView.state.doc.nodeSize - 2, toPos),
		Math.min(editorView.state.doc.nodeSize - 2, toPos + contextLength),
	);
	return {
		from: fromPos,
		to: toPos,
		exact: exact,
		prefix: prefix,
		suffix: suffix,
	};
};

export const reanchorDiscussion = (editorView, firebaseRef, discussionId) => {
	const collabPlugin = editorView.state.collaborative$ || {};
	const newCurrentKey = collabPlugin.mostRecentRemoteKey;
	const selection = editorView.state.selection;
	const newAnchor = selection.anchor;
	const newHead = selection.head;

	const transaction = editorView.state.tr;
	transaction.setMeta('removeDiscussion', { id: discussionId });
	editorView.dispatch(transaction);
	firebaseRef
		.child('discussions')
		.child(discussionId)
		.update({
			currentKey: newCurrentKey,
			selection: {
				a: newAnchor,
				h: newHead,
				t: 'text',
			},
		});
};

export const focus = (editorView) => {
	editorView.focus();
};
