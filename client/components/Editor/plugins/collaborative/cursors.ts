import { uncompressSelectionJSON } from 'prosemirror-compress-pubpub';
import { AllSelection, Plugin, PluginKey, Selection } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';

export const cursorsPluginKey = new PluginKey('cursors');

const generateCursorDecorations = (cursorData: any, editorState: any, localClientId: string) => {
	if (cursorData.id === localClientId) {
		return [];
	}

	let selection: Selection;
	try {
		// handle both compressed (legacy) and uncompressed selection formats
		const selJSON = cursorData.selection?.a !== undefined
			? uncompressSelectionJSON(cursorData.selection)
			: cursorData.selection;

		selection = Selection.fromJSON(editorState.doc, selJSON);
	} catch (_err) {
		return [];
	}

	const formattedDataId = `c-${cursorData.id}`;
	const elem = document.createElement('span');
	elem.className = `collab-cursor ${formattedDataId}`;

	const innerChildBar = document.createElement('span');
	innerChildBar.className = 'inner-bar';
	elem.appendChild(innerChildBar);

	const style = document.createElement('style');
	elem.appendChild(style);
	let innerStyle = '';

	const innerChildCircleSmall = document.createElement('span');
	innerChildCircleSmall.className = `inner-circle-small ${formattedDataId}`;
	innerChildBar.appendChild(innerChildCircleSmall);

	const hoverItemsWrapper = document.createElement('span');
	hoverItemsWrapper.className = 'hover-wrapper';
	innerChildBar.appendChild(hoverItemsWrapper);

	const innerChildCircleBig = document.createElement('span');
	innerChildCircleBig.className = 'inner-circle-big';
	hoverItemsWrapper.appendChild(innerChildCircleBig);

	if (cursorData.initials) {
		const innerCircleInitials = document.createElement('span');
		innerCircleInitials.className = `initials ${formattedDataId}`;
		innerStyle += `.initials.${formattedDataId}::after { content: "${cursorData.initials}"; } `;
		hoverItemsWrapper.appendChild(innerCircleInitials);
	}

	if (cursorData.image) {
		const innerCircleImage = document.createElement('span');
		innerCircleImage.className = `image ${formattedDataId}`;
		innerStyle += `.image.${formattedDataId}::after { background-image: url('${cursorData.image}'); } `;
		hoverItemsWrapper.appendChild(innerCircleImage);
	}

	if (cursorData.name) {
		const innerCircleName = document.createElement('span');
		innerCircleName.className = `name ${formattedDataId}`;
		innerStyle += `.name.${formattedDataId}::after { content: "${cursorData.name}"; } `;
		if (cursorData.cursorColor) {
			innerCircleName.style.backgroundColor = cursorData.cursorColor;
		}
		hoverItemsWrapper.appendChild(innerCircleName);
	}

	if (cursorData.cursorColor) {
		innerChildBar.style.backgroundColor = cursorData.cursorColor;
		innerChildCircleSmall.style.backgroundColor = cursorData.cursorColor;
		innerChildCircleBig.style.backgroundColor = cursorData.cursorColor;
		innerStyle += `.name.${formattedDataId}::after { background-color: ${cursorData.cursorColor} !important; } `;
	}

	style.innerHTML = innerStyle;

	const selectionFrom = selection.from;
	const selectionTo = selection.to;
	const selectionHead = selection.head;

	const decorations: Decoration[] = [];

	decorations.push(
		Decoration.widget(selectionHead, elem, {
			key: `cursor-widget-${cursorData.id}`,
		}) as any,
	);

	if (selectionFrom !== selectionTo) {
		decorations.push(
			Decoration.inline(
				selectionFrom,
				selectionTo,
				{
					class: `cursor-range ${formattedDataId}`,
					style: `background-color: ${cursorData.backgroundColor || 'rgba(0, 25, 150, 0.2)'};`,
				},
				{ key: `cursor-inline-${cursorData.id}` },
			) as any,
		);
	}

	return decorations;
};

export default (schema: any, props: any, collabDocPluginKey: PluginKey) => {
	let abortController: AbortController | null = null;
	let currentIndicators: Map<string, any> = new Map();

	return new Plugin({
		key: cursorsPluginKey,
		state: {
			init: (_config: any, editorState: any) => {
				return {
					cursorDecorations: DecorationSet.create(editorState.doc, []),
				};
			},
			apply: (transaction: any, pluginState: any, _prevEditorState: any, editorState: any) => {
				if (props.isReadOnly) {
					return pluginState;
				}

				const indicatorsUpdate = transaction.getMeta('presenceIndicators');

				if (indicatorsUpdate) {
					const { localClientId } = collabDocPluginKey.getState(editorState);
					const allDecorations: Decoration[] = [];

					for (const [_id, indicator] of currentIndicators) {
						const decos = generateCursorDecorations(
							indicator,
							editorState,
							localClientId,
						);
						allDecorations.push(...decos);
					}

					return {
						cursorDecorations: DecorationSet.create(editorState.doc, allDecorations),
					};
				}

				return {
					cursorDecorations: pluginState.cursorDecorations.map(
						transaction.mapping,
						transaction.doc,
					),
				};
			},
		},
		view: (view: EditorView) => {
			if (props.isReadOnly || !props.collaborativeOptions) {
				return { destroy: () => {} };
			}

			const { pubId } = props.collaborativeOptions;
			const { localClientId, localClientData } = collabDocPluginKey.getState(view.state);

			abortController = new AbortController();
			let polling = true;

			let presenceRef = Math.random().toString(36).slice(2);

			const sendPresenceUpdate = () => {
				const { selection } = view.state;

				if (selection instanceof AllSelection) {
					return;
				}

				presenceRef = Math.random().toString(36).slice(2);

				const indicator = {
					clientId: localClientId,
					ref: presenceRef,
					...localClientData,
					selection: selection.toJSON(),
				};

				fetch(`/api/pubs/${pubId}/presence/${localClientId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(indicator),
					signal: abortController!.signal,
				}).catch(() => {});
			};

			const pollPresence = async () => {
				let refs: Record<string, string> = {};

				while (polling && !abortController!.signal.aborted) {
					try {
						const response = await fetch(`/api/pubs/${pubId}/presence`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ clientId: localClientId, refs }),
							signal: abortController!.signal,
						});

						if (!response.ok) {
							await new Promise((r) => setTimeout(r, 3000));
							continue;
						}

						const indicators = await response.json();

						if (indicators && typeof indicators === 'object') {
							for (const [id, indicator] of Object.entries(indicators) as any) {
								if (id !== localClientId && indicator) {
									currentIndicators.set(id, { id, ...indicator });
									refs[id] = indicator.ref ?? '';
								}
							}

							const { tr } = view.state;
							tr.setMeta('presenceIndicators', true);
							view.dispatch(tr);
						}
					} catch (e: any) {
						if (e.name === 'AbortError') break;
						await new Promise((r) => setTimeout(r, 3000));
					}
				}
			};

			pollPresence();

			let lastAnchor = -1;
			let lastHead = -1;

			const checkSelectionChange = () => {
				const { anchor, head } = view.state.selection;

				if (anchor !== lastAnchor || head !== lastHead) {
					lastAnchor = anchor;
					lastHead = head;
					sendPresenceUpdate();
				}
			};

			const interval = setInterval(checkSelectionChange, 1000);

			return {
				destroy: () => {
					polling = false;
					clearInterval(interval);
					abortController?.abort();
					currentIndicators.clear();
				},
			};
		},
		props: {
			decorations: (editorState: any) => {
				const { cursorDecorations } = cursorsPluginKey.getState(editorState);
				return cursorDecorations;
			},
		},
	});
};
