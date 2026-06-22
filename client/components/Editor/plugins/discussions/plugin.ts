import type { Node } from 'prosemirror-model';

import type { DiscussionsOptions, PluginsOptions } from '../../types';
import type {
	DiscussionDecoration,
	DiscussionSelection,
	DiscussionsFastForwardFn,
	DiscussionsUpdateResult,
	NullableDiscussions,
} from './types';

import { type EditorState, Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import { Step } from 'prosemirror-transform';
import { DecorationSet, type EditorView } from 'prosemirror-view';

import { getDiscussionsFromAnchors } from './anchors';
import { getDecorationsForDiscussions, getDecorationsForUpdateResult } from './decorations';
import { createDiscussionsState } from './discussionsState';
import { connectToRemoteDiscussions } from './polling';
import { mapDiscussionThroughSteps } from './util';

export const discussionsPluginKey = new PluginKey('discussions');

type SyncDraftDiscussions = ReturnType<typeof createDiscussionsState>;

type PluginState = {
	decorations: DecorationSet;
	addDiscussion: SyncDraftDiscussions['addDiscussion'];
};

const createFastForward = (pubId: string, schema: any): DiscussionsFastForwardFn => {
	return async (discussions: NullableDiscussions, _fromDoc: Node, toKey: number) => {
		const lowestKey = Object.values(discussions).reduce((min, d) => {
			if (d && d.currentKey < min) return d.currentKey;
			return min;
		}, toKey);

		if (lowestKey >= toKey) return {};

		try {
			const response = await fetch(
				`/api/pubs/${pubId}/commits/steps?from=${lowestKey}&to=${toKey}`,
			);
			if (!response.ok) return {};
			const commits = (await response.json()) as { version: number; steps: any[] }[];

			const result: Record<string, any> = {};
			for (const [id, discussion] of Object.entries(discussions)) {
				if (!discussion) continue;
				const relevantCommits = commits.filter((c) => c.version > discussion.currentKey);
				const steps = relevantCommits.flatMap((c) =>
					c.steps.map((s: any) => Step.fromJSON(schema, s)),
				);
				if (steps.length > 0) {
					const mapped = mapDiscussionThroughSteps(discussion, steps);
					result[id] = { ...mapped, currentKey: toKey };
				}
			}
			return result;
		} catch {
			return {};
		}
	};
};

const createPlugin = (discussionsOptions: DiscussionsOptions, initialDoc: Node) => {
	const { discussionAnchors, pubId, initialHistoryKey, onNewDiscussionIds } = discussionsOptions;
	const remote = pubId ? connectToRemoteDiscussions(pubId) : null;
	const initialDiscussions = getDiscussionsFromAnchors(discussionAnchors);

	let editorView: null | EditorView = null;

	const { addDiscussion, handleTransaction } = createDiscussionsState({
		initialDiscussions,
		initialHistoryKey,
		initialDoc,
		remoteDiscussions: remote || null,
		fastForwardDiscussions: pubId ? createFastForward(pubId, initialDoc.type.schema) : null,
		onNewDiscussionIds,
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

	const apply = (tr: Transaction, pluginState: PluginState, _oldState: EditorState, newState: EditorState) => {
		const updateResult = getUpdateResult(tr, newState);
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
