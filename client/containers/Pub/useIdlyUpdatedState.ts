import { useCallback, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import { Callback, PatchFn, PatchFnArg } from 'types';

type InitialValue<T> = T | (() => T);

declare global {
	interface Window {
		requestIdleCallback(cb: Callback): number;
	}
}

export type IdlePatchFn<T> = PatchFn<T> & {
	immediately: (isImmediate: boolean) => PatchFn<T>;
};

const createIdleCallbackManager = (timeout: number) => {
	let callbacks: Callback[] = [];
	let idleStateCallbackHandle: null | number = null;

	const runCallbacks = () => {
		// This call batches React useState updates within these callbacks into a single re-render.
		// When we upgrade to React 18, this will become the default behavior, and we can remove it.
		// https://reactjs.org/blog/2022/03/29/react-v18.html#new-feature-automatic-batching
		ReactDOM.unstable_batchedUpdates(() => {
			for (let i = 0; i < callbacks.length; i++) {
				callbacks[i]();
			}
			idleStateCallbackHandle = null;
			callbacks = [];
		});
	};

	const requestBatchedIdleCallback = (callback: Callback) => {
		if (!callbacks.includes(callback)) {
			callbacks.push(callback);
		}
		if ('requestIdleCallback' in window) {
			if (idleStateCallbackHandle === null) {
				idleStateCallbackHandle = requestIdleCallback(runCallbacks, { timeout });
			}
		} else {
			runCallbacks();
		}
	};

	return { requestBatchedIdleCallback };
};

const { requestBatchedIdleCallback } = createIdleCallbackManager(50);

export const useIdlyUpdatedState = <T>(initialValue: InitialValue<T>) => {
	const [state, setUnderlyingState] = useState(initialValue);
	const queuedUpdates = useRef<PatchFnArg<T>[]>([]);

	const commitStateChanges = useCallback(
		() =>
			setUnderlyingState((prevState) => {
				let nextState = prevState;
				const updates = queuedUpdates.current;
				for (let i = 0; i < updates.length; i++) {
					const update = updates[i];
					const patch = typeof update === 'function' ? update(nextState) : update;
					nextState = { ...nextState, ...patch };
				}
				queuedUpdates.current = [];
				return nextState;
			}),
		[],
	);

	const updateState: IdlePatchFn<T> = useMemo(
		() => {
			const stateUpdater = (update: PatchFnArg<T>) => {
				queuedUpdates.current.push(update);
				requestBatchedIdleCallback(commitStateChanges);
			};

			const immediately = (isImmediate = true) => {
				return (update: PatchFnArg<T>) => {
					if (isImmediate) {
						queuedUpdates.current.push(update);
						commitStateChanges();
					} else {
						updateState(update);
					}
				};
			};

			return Object.assign(stateUpdater, { immediately });
		},
		// React Hook useMemo has a missing dependency: 'T'
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[commitStateChanges],
	);

	return [state, updateState] as const;
};
