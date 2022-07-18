import { Node } from 'prosemirror-model';
import { Plugin, PluginKey, Transaction, EditorState } from 'prosemirror-state';
import { DecorationSet, EditorView } from 'prosemirror-view';

import { PluginsOptions, DiscussionsOptions } from '../../types';

import { getDiscussionsFromAnchors } from './anchors';
import { getDecorationsForDiscussions, getDecorationsForUpdateResult } from './decorations';
import { createDiscussionsState } from './discussionsState';
import { createFastForwarder } from './fastForward';
import { connectToFirebaseDiscussions } from './firebase';
import { DiscussionsUpdateResult, DiscussionSelection, DiscussionDecoration } from './types';

export const discussionsPluginKey = new PluginKey('discussions');

type SyncDraftDiscussions = ReturnType<typeof createDiscussionsState>;

type PluginState = {
	decorations: DecorationSet;
	addDiscussion: SyncDraftDiscussions['addDiscussion'];
};

const createPlugin = (discussionsOptions: DiscussionsOptions, initialDoc: Node) => {
	const { discussionAnchors, draftRef, initialHistoryKey } = discussionsOptions;
	const discussionsRef = draftRef?.child('discussions');
	const remote = discussionsRef && connectToFirebaseDiscussions(discussionsRef);
	const fastForward = draftRef && createFastForwarder(draftRef);
	const initialDiscussions = getDiscussionsFromAnchors(discussionAnchors);

	let editorView: null | EditorView = null;

	const { addDiscussion, handleTransaction } = createDiscussionsState({
		initialDiscussions,
		initialHistoryKey,
		initialDoc,
		remoteDiscussions: remote || null,
		fastForwardDiscussions: fastForward || null,
		onUpdateDiscussions: (updateResult: DiscussionsUpdateResult) => {
			if (editorView) {
				const { tr } = editorView.state;
				tr.setMeta(discussionsPluginKey, { updateResult });
				editorView.dispatch(tr);
			}
		},
	});

	const getUpdateResult = (
		tr: Transaction,
		editorState: EditorState,
	): null | DiscussionsUpdateResult => {
		const meta = tr.getMeta(discussionsPluginKey);
		if (meta && meta.updateResult) {
			return meta.updateResult;
		}
		return handleTransaction(tr, editorState);
	};

	const init = (): PluginState => {
		const initialDecorations = getDecorationsForDiscussions(initialDiscussions);
		return {
			decorations: DecorationSet.create(initialDoc, initialDecorations),
			addDiscussion,
		};
	};

	const apply = (tr: Transaction, pluginState: PluginState, editorState: EditorState) => {
		const updateResult = getUpdateResult(tr, editorState);
		if (updateResult) {
			return {
				...pluginState,
				decorations: getDecorationsForUpdateResult(pluginState.decorations, updateResult),
			};
		}
		return pluginState;
	};

	return new Plugin<PluginState>({
		key: discussionsPluginKey,
		state: { init, apply },
		view: (view) => {
			editorView = view;
			return {
				destroy: () => {
					remote?.disconnect();
				},
			};
		},
		props: {
			decorations: function (editorState: EditorState) {
				let decorations: DecorationSet | undefined;
				if (this instanceof Plugin) {
					const pluginState = this.getState(editorState);
					if (pluginState) {
						decorations = pluginState.decorations;
					}
				}
				return decorations;
			},
		},
	});
};

export const addDiscussionToView = (
	view: EditorView,
	id: string,
	selection: DiscussionSelection,
) => {
	const pluginState = discussionsPluginKey.getState(view.state) as null | PluginState;
	if (pluginState) {
		return pluginState.addDiscussion(id, selection);
	}
	return null;
};

export const getAnchoredDiscussionIds = (view: EditorView) => {
	const pluginState = discussionsPluginKey.getState(view.state) as null | PluginState;
	if (pluginState) {
		const { decorations } = pluginState;
		const ids: string[] = [];
		decorations.find().forEach((decoration) => {
			const { widgetForDiscussionId } = decoration.spec as DiscussionDecoration['spec'];
			if (widgetForDiscussionId) {
				ids.push(widgetForDiscussionId);
			}
		});
		return ids;
	}
	return [];
};

export default (_, options: PluginsOptions) => {
	const { discussionsOptions, initialDoc } = options;
	if (discussionsOptions) {
		return createPlugin(discussionsOptions, initialDoc);
	}
	return [];
};
