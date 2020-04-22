import { Plugin, Selection, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { sendableSteps } from 'prosemirror-collab';
import { uncompressSelectionJSON } from 'prosemirror-compress-pubpub';

export const discussionsPluginKey = new PluginKey('discussions');

export default (schema, props, collabDocPluginKey) => {
	const syncDiscussions = (discussionDecorations, editorState) => {
		discussionDecorations
			.find()
			.filter((discussionDecoration) => {
				return discussionDecoration.spec.key.indexOf('discussion-widget-') === -1;
			})
			.forEach((discussionDecoration) => {
				const discussionId = discussionDecoration.spec.key.replace(
					'discussion-inline-',
					'',
				);
				const onStatusChange = props.collaborativeOptions.onStatusChange || function() {};
				props.collaborativeOptions.firebaseRef
					.child('discussions')
					.child(discussionId)
					.transaction(
						(existingDiscussionData) => {
							const mostRecentRemoteKey = collabDocPluginKey.getState(editorState)
								.mostRecentRemoteKey;
							if (existingDiscussionData.currentKey >= mostRecentRemoteKey) {
								return undefined;
							}
							onStatusChange('saving');
							return {
								...existingDiscussionData,
								currentKey: mostRecentRemoteKey,
								selection: {
									a: discussionDecoration.from,
									h: discussionDecoration.to,
									t: 'text',
								},
							};
						},
						() => {
							onStatusChange('saved');
						},
						false,
					)
					.catch((err) => {
						console.error('Discussions Sync Failed', err);
					});
			});
	};

	const generateDiscussionDecorations = (discussionData, editorState, prevDecorations) => {
		/* New discussions and discussions that aren't tracked are treated as the same. */
		/* If you do track a disucssion, or have sendable steps, or the keys don't match, ignore the update */
		const alreadyHandled = prevDecorations.find().reduce((prev, curr) => {
			const currId = curr.spec.key
				.replace('discussion-inline-', '')
				.replace('discussion-widget-', '');
			if (currId === discussionData.id) {
				return true;
			}
			return prev;
		}, false);

		/* Invalid selections can happen if an item is synced before the corresponding changes from that */
		/* remote editor. This try-catch is a safegaurd against that scenario. We simply ignore the */
		/* decoration, and wait for the proper position to sync. */
		let selection;
		try {
			selection = Selection.fromJSON(
				editorState.doc,
				uncompressSelectionJSON(discussionData.selection),
			);
		} catch (err) {
			return [];
		}

		if (
			discussionData.currentKey ===
				collabDocPluginKey.getState(editorState).mostRecentRemoteKey &&
			!sendableSteps(editorState) &&
			!alreadyHandled
		) {
			const highlightTo = selection.to;
			const elem = document.createElement('span');
			elem.className = `discussion-mount dm-${discussionData.id}`;
			const inlineDecoration = Decoration.inline(
				selection.from,
				selection.to,
				{
					class: `discussion-range d-${discussionData.id}`,
					// style: `background-color: ${'rgba(50, 25, 50, 0.2)'};`,
				},
				{ key: `discussion-inline-${discussionData.id}` },
			);
			const widgetDecoration = Decoration.widget(highlightTo, elem, {
				stopEvent: () => {
					return true;
				},
				key: `discussion-widget-${discussionData.id}`,
				marks: [],
			});
			return [inlineDecoration, widgetDecoration];
		}
		return [];
	};

	return new Plugin({
		key: discussionsPluginKey,
		state: {
			init: (config, editorState) => {
				return {
					discussionDecorations: DecorationSet.create(editorState.doc, []),
				};
			},
			apply: (transaction, pluginState, prevEditorState, editorState) => {
				/* Discussion Decorations to remove */
				const discussionDecorationsToRemove = pluginState.discussionDecorations
					.find()
					.filter((decoration) => {
						const removeData = transaction.meta.removeDiscussion || {};
						const removedId = removeData.id;

						const decorationId = decoration.spec.key
							.replace('discussion-inline-', '')
							.replace('discussion-widget-', '');

						const isRemoved = removedId === decorationId;
						return isRemoved;
					});

				/* Discussion Decorations to Add */
				const setDiscussionData = transaction.meta.setDiscussion;
				const discussionDecorationsToAdd = setDiscussionData
					? generateDiscussionDecorations(
							setDiscussionData,
							editorState,
							pluginState.discussionDecorations,
					  )
					: [];

				/* Remove, Map, and Add Discussions */
				const nextDiscussionDecorations = pluginState.discussionDecorations
					.remove(discussionDecorationsToRemove)
					.map(transaction.mapping, transaction.doc)
					.add(editorState.doc, discussionDecorationsToAdd);

				if (transaction.meta.collab$) {
					syncDiscussions(nextDiscussionDecorations, editorState);
				}

				return {
					discussionDecorations: nextDiscussionDecorations,
				};
			},
		},
		view: (view) => {
			const issueDecoTrans = (metaType) => {
				return (snapshot) => {
					const trans = view.state.tr;
					trans.setMeta(metaType, {
						...snapshot.val(),
						id: snapshot.key,
					});
					view.dispatch(trans);
				};
			};
			const discussionsRef = props.collaborativeOptions.firebaseRef.child('discussions');
			discussionsRef.on('child_added', issueDecoTrans('setDiscussion'));
			discussionsRef.on('child_changed', issueDecoTrans('setDiscussion'));
			discussionsRef.on('child_removed', issueDecoTrans('removeDiscussion'));

			return {};
		},
		props: {
			decorations: (editorState) => {
				const discussionDecorations = discussionsPluginKey
					.getState(editorState)
					.discussionDecorations.find();
				return DecorationSet.create(editorState.doc, discussionDecorations);
			},
		},
	});
};
