import { Node } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

import { collabDocPluginKey } from '../collaborative';

type Callback = () => unknown;

type KeyCallback = {
	key: number;
	callback: Callback;
};

const getReadyCallbacks = (callbacks: KeyCallback[], historyKey: number) => {
	const ready: KeyCallback[] = [];
	const notReady: KeyCallback[] = [];

	callbacks.forEach((callback) => {
		if (historyKey >= callback.key) {
			ready.push(callback);
		} else {
			notReady.push(callback);
		}
	});

	return { ready: ready, notReady: notReady };
};

export const createHistoryState = (initialDoc: Node, initialHistoryKey: number) => {
	let historyKey = initialHistoryKey;
	let doc = initialDoc;
	let callbacks: KeyCallback[] = [];

	const onReachesKey = (key: number, callback: Callback) => {
		if (historyKey >= key) {
			callback();
		} else {
			callbacks.push({ key: key, callback: callback });
		}
	};

	const getState = () => {
		return {
			currentHistoryKey: historyKey,
			currentDoc: doc,
		};
	};

	const updateState = (tr: Transaction, nextState: EditorState) => {
		const previousHistoryKey = historyKey;
		const previousDoc = doc;

		const collabState = collabDocPluginKey.getState(nextState);
		const nextHistoryKey: number = collabState?.mostRecentRemoteKey ?? -1;
		const nextDoc = tr.doc;

		if (nextHistoryKey >= historyKey) {
			historyKey = nextHistoryKey;
			doc = nextDoc;
		}

		if (historyKey > previousHistoryKey) {
			const { ready, notReady } = getReadyCallbacks(callbacks, historyKey);
			callbacks = notReady;
			ready.forEach((kc) => kc.callback());
		}

		return {
			...getState(),
			previousHistoryKey: previousHistoryKey,
			previousDoc: previousDoc,
		};
	};

	return { onReachesKey: onReachesKey, updateState: updateState, getState: getState };
};
