import { useState, useCallback, useRef, useMemo } from 'react';
import { useBeforeUnload } from 'react-use';
import useStateRef from 'react-usestateref';

type UpdateFnArg<T> = Partial<T> | ((current: T) => T);

export const usePersistableState = <T extends Record<string, any>>(
	initialPersistedState: T | (() => T),
	persistFn: (update: Partial<T>, full: T) => Promise<void>,
	initialUnpersistedState: Partial<T> = {},
) => {
	const [persistedState, setPersistedState, persistedStateRef] =
		useStateRef(initialPersistedState);
	const [unpersistedState, setUnpersistedState, unpersistedStateRef] =
		useStateRef(initialUnpersistedState);

	const [isPersisting, setIsPersisting] = useState(false);
	const [error, setError] = useState(null as any);
	const hasChanges = Object.keys(unpersistedState).length > 0;

	const state = useMemo(
		() => ({ ...persistedState, ...unpersistedState }),
		[persistedState, unpersistedState],
	);

	const persistFnRef = useRef(persistFn);
	persistFnRef.current = persistFn;

	const persist = useCallback(() => {
		const unpersistedStateNow = unpersistedStateRef.current;
		const nextPersistedState = {
			...persistedStateRef.current,
			...unpersistedStateNow,
		};
		const latestPersistFn = persistFnRef.current;
		setIsPersisting(true);
		return latestPersistFn(unpersistedStateNow, nextPersistedState)
			.then(() => {
				setError(null);
				setPersistedState(nextPersistedState);
				setUnpersistedState({});
			})
			.catch((err) => setError(err))
			.finally(() => setIsPersisting(false));
	}, [persistedStateRef, setPersistedState, setUnpersistedState, unpersistedStateRef]);

	const revert = useCallback(() => {
		setUnpersistedState({});
	}, [setUnpersistedState]);

	const update = useCallback(
		(next: UpdateFnArg<T>, andPersist = false) => {
			setUnpersistedState((current) => {
				const updatedState =
					typeof next === 'function'
						? next({ ...persistedStateRef.current, ...current })
						: next;
				return { ...current, ...updatedState };
			});
			if (andPersist) {
				persist();
			}
		},
		// React Hook useCallback has a missing dependency: 'T'. Either include it or remove the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[persist, persistedStateRef, setUnpersistedState],
	);

	const updatePersistedState = useCallback(
		(next: UpdateFnArg<T>) => {
			setPersistedState((current) => {
				const updatedState = typeof next === 'function' ? next(current) : next;
				return { ...current, ...updatedState };
			});
		},
		// React Hook useCallback has a missing dependency: 'T'. Either include it or remove the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[setPersistedState],
	);

	useBeforeUnload(hasChanges);

	return {
		hasChanges,
		updatePersistedState,
		persist,
		revert,
		state,
		unpersistedState,
		persistedState,
		isPersisting,
		update,
		error,
	};
};
