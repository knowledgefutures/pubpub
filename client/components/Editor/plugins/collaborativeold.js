import { AllSelection, EditorState, Plugin, Selection, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { collab, receiveTransaction, sendableSteps } from 'prosemirror-collab';
import { Step } from 'prosemirror-transform';
import { Node } from 'prosemirror-model';
import {
	compressSelectionJSON,
	compressStepJSON,
	uncompressSelectionJSON,
	uncompressStepJSON,
} from 'prosemirror-compress-pubpub';
import uuidv4 from 'uuid/v4';
import { generateHash, storeCheckpoint, firebaseTimestamp } from '../utils';

/*
	Load doc from firebase
	Generate initialContent
	Pass that into Editor
	Server Render HTML
	On Client, load Editor
	Editor create init doc
	collaborative sets up listeners
	collaborative gets discussions, applies the ones that match the dockey (with no sendable), keeps track of their ids
	non-applied decorations are applied whenever their key matches the mostRecentRemote and there are no sendable steps
*/

/*	Collab Lifecycle
	================
	1. user input
	2. apply()
	3. sendCollab()
	4. decorations()
	5. view()
	6. receiveCollab()
	7. apply()
	8. sendCollab() [doesn't send due to meta showing the transaction is a collab one]
	9. decorations()
	10. view()
*/

export default (schema, props) => {
	const collabOptions = props.collaborativeOptions;
	if (!collabOptions.firebaseRef) {
		return [];
	}

	const localClientId = `${collabOptions.clientData.id}-${generateHash(6)}`;

	return [
		collab({
			clientID: localClientId,
		}),
		/* eslint-disable-next-line no-use-before-define */
		new CollaborativePlugin({
			firebaseRef: collabOptions.firebaseRef,
			delayLoadingDocument: collabOptions.delayLoadingDocument,
			isReadOnly: props.isReadOnly,
			initialContent: props.initialContent,
			onError: props.onError,
			initialDocKey: collabOptions.initialDocKey,
			localClientData: collabOptions.clientData,
			localClientId: localClientId,
			onStatusChange: collabOptions.onStatusChange || function() {},
			onUpdateLatestKey: collabOptions.onUpdateLatestKey || function() {},
		}),
	];
};

export const collaborativePluginKey = new PluginKey('collaborative');

class CollaborativePlugin extends Plugin {
	constructor(pluginProps) {
		super({ key: collaborativePluginKey });
		this.pluginProps = pluginProps;

		/* Bind plugin functions */
		this.loadDocument = this.loadDocument.bind(this);
		this.receiveCollabChanges = this.receiveCollabChanges.bind(this);
		this.sendCollabChanges = this.sendCollabChanges.bind(this);
		this.issueDecoTransaction = this.issueDecoTransaction.bind(this);
		this.setResendTimeout = this.setResendTimeout.bind(this);
		this.generateCursorDecorations = this.generateCursorDecorations.bind(this);
		this.generateDiscussionDecorations = this.generateDiscussionDecorations.bind(this);
		this.syncDiscussions = this.syncDiscussions.bind(this);

		/* Init plugin variables */
		this.startedLoad = false;
		this.mostRecentRemoteKey = pluginProps.initialDocKey;
		this.ongoingTransaction = false;
		this.resendSyncTimeout = undefined;

		/* Setup Prosemirror plugin values */
		this.spec = {
			state: {
				init: (config, editorState) => {
					return {
						isLoaded: false,
						cursorDecorations: DecorationSet.create(editorState.doc, []),
						discussionDecorations: DecorationSet.create(editorState.doc, []),
					};
				},
				apply: this.apply.bind(this),
			},
			view: (view) => {
				this.view = view;
				if (!this.pluginProps.delayLoadingDocument) {
					this.loadDocument();
				}
				return {
					update: (newView) => {
						this.view = newView;
					},
				};
			},
		};
		this.props = {
			decorations: this.decorations.bind(this),
		};
	}

	loadDocument() {
		if (this.startedLoad) {
			return null;
		}
		this.startedLoad = true;

		// console.time('restoringdiscussions');
		// restoreDiscussionMaps(this.pluginProps.firebaseRef, this.view.state.schema).then(() => {
		// 	console.timeEnd('restoringdiscussions');
		// });

		return this.pluginProps.firebaseRef
			.child('changes')
			.orderByKey()
			.startAt(String(this.mostRecentRemoteKey + 1))
			.once('value')
			.then((changesSnapshot) => {
				const changesSnapshotVal = changesSnapshot.val() || {};
				const steps = [];
				const stepClientIds = [];
				const keys = Object.keys(changesSnapshotVal);
				this.mostRecentRemoteKey = keys.length
					? keys
							.map((key) => Number(key))
							.reduce((prev, curr) => {
								return curr > prev ? curr : prev;
							}, 0)
					: this.mostRecentRemoteKey;

				/* Uncompress steps and add stepClientIds */
				Object.keys(changesSnapshotVal).forEach((key) => {
					const compressedStepsJSON = changesSnapshotVal[key].s;
					const uncompressedSteps = compressedStepsJSON.map((compressedStepJSON) => {
						return Step.fromJSON(
							this.view.state.schema,
							uncompressStepJSON(compressedStepJSON),
						);
					});
					steps.push(...uncompressedSteps);
					stepClientIds.push(
						...new Array(compressedStepsJSON.length).fill(changesSnapshotVal[key].c),
					);
				});

				/* Update the prosemirror view with new doc */
				const newDoc = Node.fromJSON(
					this.view.state.schema,
					this.pluginProps.initialContent,
				);
				this.view.updateState(
					EditorState.create({
						doc: newDoc,
						plugins: this.view.state.plugins,
					}),
				);

				this.pluginProps.onUpdateLatestKey(this.mostRecentRemoteKey);

				const trans = receiveTransaction(this.view.state, steps, stepClientIds);
				this.view.dispatch(trans);

				/* Retrieve and Listen to Cursors */
				if (!this.pluginProps.isReadOnly) {
					const cursorsRef = this.pluginProps.firebaseRef.child('cursors');
					cursorsRef
						.child(this.pluginProps.localClientId)
						.onDisconnect()
						.remove();
					cursorsRef.on('child_added', this.issueDecoTransaction('setCursor'));
					cursorsRef.on('child_changed', this.issueDecoTransaction('setCursor'));
					cursorsRef.on('child_removed', this.issueDecoTransaction('removeCursor'));
				}

				/* Retrieve and Listen to Discussions */
				const discussionsRef = this.pluginProps.firebaseRef.child('discussions');
				discussionsRef.on('child_added', this.issueDecoTransaction('setDiscussion'));
				discussionsRef.on('child_changed', this.issueDecoTransaction('setDiscussion'));
				discussionsRef.on('child_removed', this.issueDecoTransaction('removeDiscussion'));

				/* Set finishedLoading flag */
				const finishedLoadingTrans = this.view.state.tr;
				finishedLoadingTrans.setMeta('finishedLoading', true);
				this.view.dispatch(finishedLoadingTrans);

				/* Listen to Changes */
				return this.pluginProps.firebaseRef
					.child('changes')
					.orderByKey()
					.startAt(String(this.mostRecentRemoteKey + 1))
					.on('child_added', this.receiveCollabChanges);
			})
			.catch((err) => {
				console.error('In loadDocument Error with ', err, err.message);
			});
	}

	receiveCollabChanges(snapshot) {
		try {
			this.mostRecentRemoteKey = Number(snapshot.key);
			const snapshotVal = snapshot.val();
			const compressedStepsJSON = snapshotVal.s;
			const clientId = snapshotVal.cId;
			const meta = snapshotVal.m;
			const newSteps = compressedStepsJSON.map((compressedStepJSON) => {
				return Step.fromJSON(
					this.view.state.schema,
					uncompressStepJSON(compressedStepJSON),
				);
			});
			const newStepsClientIds = new Array(newSteps.length).fill(clientId);
			const trans = receiveTransaction(this.view.state, newSteps, newStepsClientIds);

			if (meta) {
				Object.keys(meta).forEach((metaKey) => {
					trans.setMeta(metaKey, meta[metaKey]);
				});
			}
			this.pluginProps.onUpdateLatestKey(this.mostRecentRemoteKey);
			return this.view.dispatch(trans);
		} catch (err) {
			console.error('Error in recieveCollabChanges:', err);
			this.pluginProps.onError(err);
			return null;
		}
	}

	sendCollabChanges(transaction, newState) {
		const validMetaKeys = ['history$', 'paste', 'uiEvent'];
		const hasInvalidMetaKeys = Object.keys(transaction.meta).some((key) => {
			const keyIsValid = validMetaKeys.includes(key);
			return !keyIsValid;
		});
		const sendable = sendableSteps(newState);

		if (this.pluginProps.isReadOnly || hasInvalidMetaKeys || !sendable) {
			return null;
		}

		if (this.ongoingTransaction) {
			/* We only allow one outgoing transaction at a time. Sometimes the
			local view is updated before an ongoing transaction is finished. If this
			is the case, we abort the newly triggered outgoing transaction. If we do
			that, we need to ensure we eventually send the most recent state for
			syncing. This timeout ensures that. */
			this.setResendTimeout();
			return null;
		}

		this.ongoingTransaction = true;
		const steps = sendable.steps;
		const clientId = sendable.clientID;

		return this.pluginProps.firebaseRef
			.child('changes')
			.child(this.mostRecentRemoteKey + 1)
			.transaction(
				(existingRemoteSteps) => {
					this.pluginProps.onStatusChange('saving');
					return existingRemoteSteps
						? undefined
						: {
								s: steps.map((step) => {
									return compressStepJSON(step.toJSON());
								}),
								t: firebaseTimestamp,
								/* Change Id */
								id: uuidv4(),
								/* Client Id */
								cId: clientId,
								/* Origin Branch Id */
								bId: this.pluginProps.firebaseRef.key.replace('branch-', ''),
						  };
				},
				null,
				false,
			)
			.then((transactionResult) => {
				const { committed, snapshot } = transactionResult;
				this.ongoingTransaction = false;
				if (committed) {
					this.pluginProps.onStatusChange('saved');

					/* If multiple of saveEveryNSteps, update checkpoint */
					const saveEveryNSteps = 100;
					if (snapshot.key && snapshot.key % saveEveryNSteps === 0) {
						storeCheckpoint(this.pluginProps.firebaseRef, newState.doc, snapshot.key);
					}
				} else {
					/* If the transaction did not commit changes, we need
					to trigger sendCollabChanges to fire again. */
					this.setResendTimeout();
				}
			})
			.catch((err) => {
				console.error('Error in firebase transaction:', err);
				this.pluginProps.onError(err);
			});
	}

	setResendTimeout() {
		clearTimeout(this.resendSyncTimeout);
		this.resendSyncTimeout = setTimeout(() => {
			this.sendCollabChanges({ meta: {} }, this.view.state);
		}, 2000);
		return null;
	}

	apply(transaction, pluginState, prevEditorState, editorState) {
		/* Remove Stale Cursors */
		pluginState.cursorDecorations.find().forEach((decoration) => {
			const expirationTime = 1000 * 60 * 5; /* 5 minutes */
			const isExpired = decoration.spec.lastActive + expirationTime < new Date().getTime();
			if (isExpired) {
				this.pluginProps.firebaseRef
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
			? this.generateCursorDecorations(setCursorData, editorState)
			: [];

		/* Remove, Map, and Add Cursors */
		const nextCursorDecorations = pluginState.cursorDecorations
			.remove(cursorDecorationsToRemove)
			.map(transaction.mapping, transaction.doc)
			.add(editorState.doc, cursorDecorationsToAdd);

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
			? this.generateDiscussionDecorations(
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
			this.syncDiscussions(nextDiscussionDecorations);
		}

		/* Set Cursor data */
		const prevSelection = prevEditorState ? prevEditorState.selection : {};
		const selection = editorState.selection || {};
		const needsToInit = !(prevSelection.a || prevSelection.anchor);
		const isPointer = transaction.meta.pointer;
		const isNotSelectAll = selection instanceof AllSelection === false;
		const isCursorChange =
			!transaction.docChanged &&
			(selection.anchor !== prevSelection.anchor || selection.head !== prevSelection.head);
		if (isNotSelectAll && (needsToInit || isPointer || isCursorChange)) {
			const anchorEqual = prevSelection.anchor === selection.anchor;
			const headEqual = prevSelection.head === selection.head;
			if (!prevSelection.anchor || !anchorEqual || !headEqual) {
				const newCursorData = {
					...this.pluginProps.localClientData,
					selection: selection,
				};

				/* lastActive has to be rounded to the nearest minute (or some larger value)
				If it is updated every millisecond, firebase will see it as constant changes and you'll get a 
				loop of updates triggering millisecond updates. The lastActive is updated anytime a client 
				makes or receives changes. A client will be active even if they have a tab open and are 'watching'. */
				const smoothingTimeFactor = 1000 * 60;
				newCursorData.lastActive =
					Math.round(new Date().getTime() / smoothingTimeFactor) * smoothingTimeFactor;

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

				/*
					This timeout is due to a bug I could only reproduce at the pubpub
					level. I could not reproduce it in pubpub-editor storybook. Without
					the timeout, click-and-drag to create a selection acts oddly. The
					selection doesn't take. It's not entirely consistent though which
					makes it feel like a race condition. Disabling all firebase listeners
					at the pubpub level does not seem to resolve the issue. Disabling the
					editor onChange handler (at the same time as the disabled firebase
					listeners) also does not resolve the issue. It's unclear to me what is
					different at that point between pubpub-editor storybook and the editor
					used in PubBody.
				*/
				setTimeout(() => {
					this.pluginProps.firebaseRef
						.child('cursors')
						.child(this.pluginProps.localClientId)
						.set(firebaseCursorData);
				}, 0);
			}
		}

		/* Send Collab Changes */
		this.sendCollabChanges(transaction, editorState);

		return {
			isLoaded: transaction.meta.finishedLoading ? true : pluginState.isLoaded,
			cursorDecorations: nextCursorDecorations,
			discussionDecorations: nextDiscussionDecorations,
			mostRecentRemoteKey: this.mostRecentRemoteKey,
		};
	}

	syncDiscussions(discussionDecorations) {
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
				this.pluginProps.firebaseRef
					.child('discussions')
					.child(discussionId)
					.transaction(
						(existingDiscussionData) => {
							if (existingDiscussionData.currentKey >= this.mostRecentRemoteKey) {
								return undefined;
							}
							this.pluginProps.onStatusChange('saving');
							return {
								...existingDiscussionData,
								currentKey: this.mostRecentRemoteKey,
								selection: {
									a: discussionDecoration.from,
									h: discussionDecoration.to,
									t: 'text',
								},
							};
						},
						() => {
							this.pluginProps.onStatusChange('saved');
						},
						false,
					)
					.catch((err) => {
						console.error('Discussions Sync Failed', err);
					});
			});
	}

	issueDecoTransaction(metaType) {
		return (snapshot) => {
			const trans = this.view.state.tr;
			trans.setMeta(metaType, {
				...snapshot.val(),
				id: snapshot.key,
			});
			this.view.dispatch(trans);
		};
	}

	generateCursorDecorations(cursorData, editorState) {
		if (cursorData.id === this.pluginProps.localClientId) {
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
	}

	generateDiscussionDecorations(discussionData, editorState, prevDecorations) {
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
			discussionData.currentKey === this.mostRecentRemoteKey &&
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
	}

	decorations(editorState) {
		const cursorDecorations = collaborativePluginKey
			.getState(editorState)
			.cursorDecorations.find();
		const discussionDecorations = collaborativePluginKey
			.getState(editorState)
			.discussionDecorations.find();
		return DecorationSet.create(editorState.doc, [
			...cursorDecorations,
			...discussionDecorations,
		]);
	}
}
