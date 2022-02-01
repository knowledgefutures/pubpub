import { Schema } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { receiveTransaction, sendableSteps } from 'prosemirror-collab';
import { Step } from 'prosemirror-transform';
import { uncompressStepJSON } from 'prosemirror-compress-pubpub';

import { DefinitelyHas } from 'types';

import { PluginsOptions } from '../../types';
import {
	storeCheckpoint,
	createFirebaseChange,
	getFirebaseConnectionMonitorRef,
} from '../../utils';

/*
Rough pipeline:
Client types changes
Client sets ongoingTransaction=true and writes a transation
if that transaction succeeds
	set ongoingTransaction=false
if that transaction fails because of error
	throw error
if that transaction fails beause there is already a keyable with that id
	process pending stored keyables

When a remote change is made and synced to client, store that keyable
Attempt to process all stored keyables
	don't process if there is an ongoing transaction

If there is an ongoing transaction, it will eventually finish and trigger a new receiveCollabChanges
	or, it will fail and that will cause processStoredKeyables to fire.
*/

const noop = () => {};

export default (
	schema: Schema,
	options: DefinitelyHas<PluginsOptions, 'collaborativeOptions'>,
	collabDocPluginKey: PluginKey,
	localClientId: string,
) => {
	const { collaborativeOptions, isReadOnly, onError = noop } = options;
	const {
		firebaseRef: ref,
		onStatusChange = noop,
		onUpdateLatestKey = noop,
	} = collaborativeOptions;
	let view;
	let mostRecentRemoteKey = collaborativeOptions.initialDocKey;
	let ongoingTransaction = false;
	let pendingRemoteKeyables = [];
	/* sendCollabChanges is called only from the main Editor */
	/* disppatchTransaction view spec paramater. sendCollabChanges */
	/* is called on every transaction, but it quickly exits if the */
	/* transaction is not of the right type (meta), or if a firebase */
	/* transaction is already in progress. */

	/* If the firebase transaction commit fails because the keyable key */
	/* already exists, we either 1) have the transaction in pendingRemoteKeyables */
	/* or we are about to receive a new firebase child. Both cases will result in  */
	/* collab.receiveTransaction being called, which will dispatch a transaction */
	/* triggering sendCollabChanges to be called again, thus syncing our local */
	/* uncommitted steps. */
	const sendCollabChanges = (newState) => {
		const sendable = sendableSteps(newState);

		if (isReadOnly || ongoingTransaction || !sendable) {
			return null;
		}

		ongoingTransaction = true;
		return ref
			.child('changes')
			.child(String(mostRecentRemoteKey + 1))
			.transaction(
				(existingRemoteSteps) => {
					onStatusChange('saving');
					if (existingRemoteSteps) {
						/* Returning undefined causes firebase transaction to abort. */
						/* https://firebase.google.com/docs/reference/js/firebase.database.Reference#transactionupdate:-function */
						return undefined;
					}
					return createFirebaseChange(sendable.steps, localClientId);
				},
				undefined,
				false,
			)
			.then((transactionResult) => {
				const { committed, snapshot } = transactionResult;
				ongoingTransaction = false;
				if (committed) {
					onStatusChange('saved');

					/* If multiple of saveEveryNSteps, update checkpoint */
					const saveEveryNSteps = 100;
					if (snapshot.key && snapshot.key % saveEveryNSteps === 0) {
						storeCheckpoint(ref, newState.doc, snapshot.key);
					}
				}
				// eslint-disable-next-line @typescript-eslint/no-use-before-define
				processStoredKeyables();
			})
			.catch((err) => {
				console.error('Error in firebase transaction:', err);
				onError(err);
			});
	};

	const extractSnapshot = (snapshotVal) => {
		const compressedStepsJSON = snapshotVal.s;
		const newSteps = compressedStepsJSON.map((compressedStepJSON) => {
			return Step.fromJSON(schema, uncompressStepJSON(compressedStepJSON));
		});
		const newClientIds = new Array(newSteps.length).fill(snapshotVal.cId);
		return {
			steps: newSteps,
			clientIds: newClientIds,
		};
	};

	/* Iterate over pendingRemoteKeyables if there is no ongoing */
	/* firebase transaction. If there is an ongoing firebase transaction */
	/* it will either fail, causing this function to be called again, or it */
	/* will succeed, which will cause a new keyable child to sync, triggering */
	/* receiveCollabChanges, and thus this function. */
	const processStoredKeyables = () => {
		if (ongoingTransaction) {
			return null;
		}
		pendingRemoteKeyables.forEach((snapshot) => {
			try {
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'val' does not exist on type 'never'.
				const { steps, clientIds } = extractSnapshot(snapshot.val());
				const trans = receiveTransaction(view.state, steps, clientIds);
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'key' does not exist on type 'never'.
				mostRecentRemoteKey = Number(snapshot.key);
				view.dispatch(trans);
				onUpdateLatestKey(mostRecentRemoteKey);
			} catch (err) {
				console.error('Error in recieveCollabChanges:', err);
				onError(err as Error);
			}
		});
		pendingRemoteKeyables = [];
		if (sendableSteps(view.state)) {
			sendCollabChanges(view.state);
		}
		return null;
	};

	/* This is called everytime firebase has a new keyable child */
	/* We store the new keyable in pendingRemoteKeyables, and then */
	/* process all existing stored keyables. */
	const receiveCollabChanges = (snapshot) => {
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
		pendingRemoteKeyables.push(snapshot);
		processStoredKeyables();
	};

	const loadDocument = () => {
		getFirebaseConnectionMonitorRef(ref).on('value', (snapshot) => {
			if (!snapshot.val()) {
				onStatusChange('disconnected');
			}
		});

		return ref
			.child('changes')
			.orderByKey()
			.startAt(String(mostRecentRemoteKey + 1))
			.once('value')
			.then((changesSnapshot) => {
				const snapshotVal = changesSnapshot.val() || {};
				const allSteps = [];
				const allStepClientIds = [];
				const keys = Object.keys(snapshotVal);

				/* Uncompress steps and add stepClientIds */
				Object.keys(snapshotVal).forEach((key) => {
					const { steps, clientIds } = extractSnapshot(snapshotVal[key]);
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
					allSteps.push(...steps);
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
					allStepClientIds.push(...clientIds);
				});

				/* We have to use .reduce here rather than simply calling */
				/* Math.max(keys) because sometimes the keys array is larger */
				/* than the allowed input size of Math.max() */
				mostRecentRemoteKey = keys.length
					? keys.map((k) => Number(k)).reduce((a, b) => Math.max(a, b), 0)
					: mostRecentRemoteKey;

				const trans = receiveTransaction(view.state, allSteps, allStepClientIds);
				view.dispatch(trans);
				onUpdateLatestKey(mostRecentRemoteKey);

				/* Set finishedLoading flag */
				const finishedLoadingTrans = view.state.tr;
				finishedLoadingTrans.setMeta('finishedLoading', true);
				view.dispatch(finishedLoadingTrans);
				onStatusChange('connected');

				/* Listen to Changes */
				return ref
					.child('changes')
					.orderByKey()
					.startAt(String(mostRecentRemoteKey + 1))
					.on('child_added', (snapshot) => {
						receiveCollabChanges(snapshot);
					});
			})
			.catch((err) => {
				console.error('In loadDocument Error with ', err, err.message);
			});
	};

	return new Plugin({
		key: collabDocPluginKey,
		state: {
			init: () => {
				return {
					isLoaded: false,
					localClientId,
					localClientData: collaborativeOptions.clientData,
					sendCollabChanges,
				};
			},
			apply: (transaction, pluginState) => {
				return {
					isLoaded: transaction.getMeta('finishedLoading') || pluginState.isLoaded,
					mostRecentRemoteKey,
					localClientId,
					localClientData: collaborativeOptions.clientData,
					sendCollabChanges,
				};
			},
		},
		view: (initView) => {
			view = initView;
			loadDocument();
			return {};
		},
	});
};
