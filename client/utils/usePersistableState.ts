import { useState, useCallback, useRef } from 'react';
import { useBeforeUnload } from 'react-use';

export const usePersistableState = <T>(
	initialPersistedState: T | (() => T),
	persistFn: (update: Partial<T>, full: T) => Promise<void>,
	initialUnpersistedState: Partial<T> = {},
) => {
	const [persistedState, setPersistedState] = useState(initialPersistedState);
	const [isPersisting, setIsPersisting] = useState(false);
	const [unpersistedState, setUnpersistedState] = useState(initialUnpersistedState);
	const [error, setError] = useState(null as any);
	const state = { ...persistedState, ...unpersistedState };
	const hasChanges = Object.keys(unpersistedState).length > 0;

	const persistFnRef = useRef(persistFn);
	persistFnRef.current = persistFn;

	const _persist = useCallback(
		(partialState: Partial<T>) => {
			const nextPersistedState = { ...persistedState, ...partialState };
			const latestPersistFn = persistFnRef.current;
			setIsPersisting(true);
			return latestPersistFn(partialState, nextPersistedState)
				.then(() => {
					setError(null);
					setPersistedState(nextPersistedState);
					setUnpersistedState({});
				})
				.catch((err) => setError(err))
				.finally(() => setIsPersisting(false));
		},
		// "Missing dependency: T"
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[persistedState],
	);

	const revert = () => setUnpersistedState({});

	const update = useCallback(
		(next: Partial<T>, andPersist = false) => {
			setUnpersistedState((current) => ({ ...current, ...next }));
			if (andPersist) {
				_persist(next);
			}
		},
		[_persist],
	);

	const updatePersistedState = (next: Partial<T>) => {
		setPersistedState((existingPersistedState) => ({ ...existingPersistedState, ...next }));
	};

	const persistUnpersistedState = () => _persist(unpersistedState);

	useBeforeUnload(hasChanges);

	return {
		hasChanges,
		updatePersistedState,
		persist: persistUnpersistedState,
		revert,
		state,
		unpersistedState,
		persistedState,
		isPersisting,
		update,
		error,
	};
};
