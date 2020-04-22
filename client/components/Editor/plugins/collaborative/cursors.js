import { AllSelection, Plugin, Selection, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { compressSelectionJSON, uncompressSelectionJSON } from 'prosemirror-compress-pubpub';

export const cursorsPluginKey = new PluginKey('cursors');

export default (schema, props, collabDocPluginKey) => {
	const generateCursorDecorations = (cursorData, editorState) => {
		const { localClientId } = collabDocPluginKey.getState(editorState);
		if (cursorData.id === localClientId) {
			return [];
		}

		/* Invalid selections can happen if an item is synced before the corresponding changes from that */
		/* remote editor. This try-catch is a safegaurd against that scenario. We simply ignore the */
		/* decoration, and wait for the proper position to sync. */
		let selection;
		try {
			selection = Selection.fromJSON(
				editorState.doc,
				uncompressSelectionJSON(cursorData.selection),
			);
		} catch (err) {
			return [];
		}

		/* Classnames must begin with letter, so append one single uuid's may not. */
		const formattedDataId = `c-${cursorData.id}`;
		const elem = document.createElement('span');
		elem.className = `collab-cursor ${formattedDataId}`;

		/* Add Vertical Bar */
		const innerChildBar = document.createElement('span');
		innerChildBar.className = 'inner-bar';
		elem.appendChild(innerChildBar);

		const style = document.createElement('style');
		elem.appendChild(style);
		let innerStyle = '';

		/* Add small circle at top of bar */
		const innerChildCircleSmall = document.createElement('span');
		innerChildCircleSmall.className = `inner-circle-small ${formattedDataId}`;
		innerChildBar.appendChild(innerChildCircleSmall);

		/* Add wrapper for hover items at top of bar */
		const hoverItemsWrapper = document.createElement('span');
		hoverItemsWrapper.className = 'hover-wrapper';
		innerChildBar.appendChild(hoverItemsWrapper);

		/* Add Large Circle for hover */
		const innerChildCircleBig = document.createElement('span');
		innerChildCircleBig.className = 'inner-circle-big';
		hoverItemsWrapper.appendChild(innerChildCircleBig);

		/* If Initials exist - add to hover items wrapper */
		if (cursorData.initials) {
			const innerCircleInitials = document.createElement('span');
			innerCircleInitials.className = `initials ${formattedDataId}`;
			innerStyle += `.initials.${formattedDataId}::after { content: "${cursorData.initials}"; } `;
			hoverItemsWrapper.appendChild(innerCircleInitials);
		}
		/* If Image exists - add to hover items wrapper */
		if (cursorData.image) {
			const innerCircleImage = document.createElement('span');
			innerCircleImage.className = `image ${formattedDataId}`;
			innerStyle += `.image.${formattedDataId}::after { background-image: url('${cursorData.image}'); } `;
			hoverItemsWrapper.appendChild(innerCircleImage);
		}

		/* If name exists - add to hover items wrapper */
		if (cursorData.name) {
			const innerCircleName = document.createElement('span');
			innerCircleName.className = `name ${formattedDataId}`;
			innerStyle += `.name.${formattedDataId}::after { content: "${cursorData.name}"; } `;
			if (cursorData.cursorColor) {
				innerCircleName.style.backgroundColor = cursorData.cursorColor;
			}
			hoverItemsWrapper.appendChild(innerCircleName);
		}

		/* If cursor color provided - override defaults */
		if (cursorData.cursorColor) {
			innerChildBar.style.backgroundColor = cursorData.cursorColor;
			innerChildCircleSmall.style.backgroundColor = cursorData.cursorColor;
			innerChildCircleBig.style.backgroundColor = cursorData.cursorColor;
			innerStyle += `.name.${formattedDataId}::after { background-color: ${cursorData.cursorColor} !important; } `;
		}
		style.innerHTML = innerStyle;
		// console.timeEnd('redner2');
		const selectionFrom = selection.from;
		const selectionTo = selection.to;
		const selectionHead = selection.head;

		const decorations = [];
		decorations.push(
			Decoration.widget(selectionHead, elem, {
				key: `cursor-widget-${cursorData.id}`,
				lastActive: cursorData.lastActive,
			}),
		);

		if (selectionFrom !== selectionTo) {
			decorations.push(
				Decoration.inline(
					selectionFrom,
					selectionTo,
					{
						class: `cursor-range ${formattedDataId}`,
						style: `background-color: ${cursorData.backgroundColor ||
							'rgba(0, 25, 150, 0.2)'};`,
					},
					{ key: `cursor-inline-${cursorData.id}`, lastActive: cursorData.lastActive },
				),
			);
		}
		return decorations;
	};

	return new Plugin({
		key: cursorsPluginKey,
		state: {
			init: (config, editorState) => {
				return {
					cursorDecorations: DecorationSet.create(editorState.doc, []),
				};
			},
			apply: (transaction, pluginState, prevEditorState, editorState) => {
				const { localClientId, localClientData } = collabDocPluginKey.getState(editorState);
				/* Remove Stale Cursors */
				pluginState.cursorDecorations.find().forEach((decoration) => {
					const expirationTime = 1000 * 60 * 5; /* 5 minutes */
					const isExpired =
						decoration.spec.lastActive + expirationTime < new Date().getTime();
					if (isExpired) {
						props.collaborativeOptions.firebaseRef
							.child('cursors')
							.child(
								decoration.spec.key
									.replace('cursor-inline-', '')
									.replace('cursor-widget-', ''),
							)
							.remove();
					}
				});

				/* Cursor Decorations to Remove */
				/* We want to remove any explicitly deleted cursor decorations */
				/* and decorations for cursors which are being newly updated */
				const cursorDecorationsToRemove = pluginState.cursorDecorations
					.find()
					.filter((decoration) => {
						const setData = transaction.meta.setCursor || {};
						const setId = setData.id;
						const removeData = transaction.meta.removeCursor || {};
						const removedId = removeData.id;

						const decorationId = decoration.spec.key
							.replace('cursor-inline-', '')
							.replace('cursor-widget-', '');

						const isRemoved = removedId === decorationId;
						const isSet = setId === decorationId;
						return isRemoved || isSet;
					});

				/* Cursor Decorations to Add */
				const setCursorData = transaction.meta.setCursor;
				const cursorDecorationsToAdd = setCursorData
					? generateCursorDecorations(setCursorData, editorState)
					: [];

				/* Remove, Map, and Add Cursors */
				const nextCursorDecorations = pluginState.cursorDecorations
					.remove(cursorDecorationsToRemove)
					.map(transaction.mapping, transaction.doc)
					.add(editorState.doc, cursorDecorationsToAdd);

				/* Set Cursor data */
				const prevSelection = prevEditorState ? prevEditorState.selection : {};
				const selection = editorState.selection || {};
				const needsToInit = !(prevSelection.a || prevSelection.anchor);
				const isPointer = transaction.meta.pointer;
				const isNotSelectAll = selection instanceof AllSelection === false;
				const isCursorChange =
					!transaction.docChanged &&
					(selection.anchor !== prevSelection.anchor ||
						selection.head !== prevSelection.head);
				if (isNotSelectAll && (needsToInit || isPointer || isCursorChange)) {
					const anchorEqual = prevSelection.anchor === selection.anchor;
					const headEqual = prevSelection.head === selection.head;
					if (!prevSelection.anchor || !anchorEqual || !headEqual) {
						const newCursorData = {
							...localClientData,
							selection: selection,
						};

						/* lastActive has to be rounded to the nearest minute (or some larger value)
						If it is updated every millisecond, firebase will see it as constant changes and you'll get a 
						loop of updates triggering millisecond updates. The lastActive is updated anytime a client 
						makes or receives changes. A client will be active even if they have a tab open and are 'watching'. */
						const smoothingTimeFactor = 1000 * 60;
						newCursorData.lastActive =
							Math.round(new Date().getTime() / smoothingTimeFactor) *
							smoothingTimeFactor;

						const firebaseCursorData = {
							...newCursorData,
							selection: needsToInit
								? {
										a: 1,
										h: 1,
										t: 'text',
								  }
								: compressSelectionJSON(selection.toJSON()),
						};

						props.collaborativeOptions.firebaseRef
							.child('cursors')
							.child(localClientId)
							.set(firebaseCursorData);
					}
				}

				return {
					cursorDecorations: nextCursorDecorations,
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

			/* Retrieve and Listen to Cursors */
			if (!props.isReadOnly) {
				const { localClientId } = collabDocPluginKey.getState(view.state);
				const cursorsRef = props.collaborativeOptions.firebaseRef.child('cursors');
				cursorsRef
					.child(localClientId)
					.onDisconnect()
					.remove();
				cursorsRef.on('child_added', issueDecoTrans('setCursor'));
				cursorsRef.on('child_changed', issueDecoTrans('setCursor'));
				cursorsRef.on('child_removed', issueDecoTrans('removeCursor'));
			}

			return {};
		},
		props: {
			decorations: (editorState) => {
				const cursorDecorations = cursorsPluginKey
					.getState(editorState)
					.cursorDecorations.find();
				return DecorationSet.create(editorState.doc, cursorDecorations);
			},
		},
	});
};
