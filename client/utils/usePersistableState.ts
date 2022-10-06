import { useState } from 'react';
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

	const _persist = (partialState: Partial<T>) => {
		const nextPersistedState = { ...persistedState, ...partialState };
		setIsPersisting(true);
		return persistFn(partialState, nextPersistedState)
			.then(() => {
				setError(null);
				setPersistedState(nextPersistedState);
				setUnpersistedState({});
			})
			.catch((err) => setError(err))
			.finally(() => setIsPersisting(false));
	};

	const revert = () => setUnpersistedState({});

	const update = (next: Partial<T>, andPersist = false) => {
		const nextState = { ...unpersistedState, ...next };
		setUnpersistedState(nextState);
		if (andPersist) {
			_persist(nextState);
		}
	};

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
