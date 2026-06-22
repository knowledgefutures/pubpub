import type { Schema } from 'prosemirror-model';

import type { DefinitelyHas } from 'types';

import type { PluginsOptions } from '../../types';

import {
	CollabClient,
	LongPollListener,
	collab,
	receiveCommitTransaction,
} from '@pitter-patter/collab-client';
import { Plugin, type PluginKey } from 'prosemirror-state';

const noop = () => {};

export default (
	schema: Schema,
	options: DefinitelyHas<PluginsOptions, 'collaborativeOptions'>,
	collabDocPluginKey: PluginKey,
	localClientId: string,
) => {
	const { collaborativeOptions, isReadOnly, onError = noop } = options;
	const { pubId, onStatusChange = noop, onUpdateLatestKey = noop } = collaborativeOptions;

	let view: any;
	let collabClient: CollabClient | null = null;
	let abortController: AbortController | null = null;

	const commitListener = new LongPollListener(
		new URL(`/api/pubs/${pubId}/commits`, window.location.origin),
	);

	const sendCollabChanges = (newState: any) => {
		if (isReadOnly || !collabClient) {
			return;
		}

		onStatusChange('saving');
		collabClient
			.send(newState)
			.then(() => {
				onStatusChange('saved');
			})
			.catch((e) => {
				console.error('Error sending collab commit:', e);
				onError(e);
			});
	};

	const startCollab = (initialState: any) => {
		const collabConfig = {
			sendCommit: async (commit: any) => {
				const response = await fetch(`/api/pubs/${pubId}/commits`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(commit.toJSON()),
				});

				if (response.status === 409) {
					throw new Error('Too much contention');
				}

				if (!response.ok) {
					throw new Error(`Commit failed: ${response.status}`);
				}

				onStatusChange('saved');
				onUpdateLatestKey(commit.version);
			},

			receiveCommits: (commits: any[]) => {
				if (!view) {
					return;
				}

				let currentState = view.state;

				for (const commit of commits) {
					const tr = receiveCommitTransaction(currentState, commit);
					view.dispatch(tr);
					currentState = view.state;
				}

				if (commits.length > 0) {
					const lastCommit = commits[commits.length - 1];
					onUpdateLatestKey(lastCommit.version);
				}
			},

			listener: commitListener,
		};

		collabClient = new CollabClient(collabConfig);
		abortController = new AbortController();

		collabClient
			.listen(initialState, abortController.signal)
			.catch((e) => {
				if (e.name !== 'AbortError') {
					console.error('Collab listener error:', e);
					onError(e);
				}
			});

		onStatusChange('connected');
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
					localClientId,
					localClientData: collaborativeOptions.clientData,
					sendCollabChanges,
				};
			},
		},
		view: (initView) => {
			view = initView;

			// mark as loaded immediately since the doc comes from the server already
			const finishedLoadingTrans = view.state.tr;
			finishedLoadingTrans.setMeta('finishedLoading', true);
			view.dispatch(finishedLoadingTrans);

			startCollab(view.state);

			return {
				destroy: () => {
					abortController?.abort();
					collabClient = null;
				},
			};
		},
	});
};
