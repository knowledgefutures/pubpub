/*
 * Used to defer the rendering of expensive components while user is typing into a pub. This reduces
 * the amount of paint time after a keypress, which lends to a more responsive editing experience :)
 */
import React, { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

type PubSuspendWhileTypingContextType = {
	markLastInput: () => unknown;
	getTimeRemainingToUpdate: (delay: number, now: number) => number;
};

export const PubSuspendWhileTypingContext = React.createContext<PubSuspendWhileTypingContextType>({
	markLastInput: () => {},
	getTimeRemainingToUpdate: () => 0,
});

type PubSuspendWhileTypingProviderProps = {
	children: React.ReactNode;
};

export const PubSuspendWhileTypingProvider = (props: PubSuspendWhileTypingProviderProps) => {
	const lastInputTime = useRef<null | number>(null);

	const getTimeRemainingToUpdate = useCallback((delay, currentTime) => {
		// Return 0 if a <PubSuspendWhileTyping> with delay={delay} should re-render at currentTime,
		// otherwise provide a time when we expect the component can re-render, assuming there are
		// no more keypresses.
		if (!lastInputTime.current) {
			return 0;
		}
		const timeSinceLastInput = currentTime - lastInputTime.current;
		return Math.max(0, delay - timeSinceLastInput);
	}, []);

	const markLastInput = useCallback(() => {
		lastInputTime.current = Date.now();
	}, []);

	const value = useMemo(() => {
		return { markLastInput, getTimeRemainingToUpdate };
	}, [getTimeRemainingToUpdate, markLastInput]);

	return (
		<PubSuspendWhileTypingContext.Provider value={value}>
			{props.children}
		</PubSuspendWhileTypingContext.Provider>
	);
};

export const usePubSuspendWhileTyping = <T extends any>(value: T, delay = 1000): T => {
	const { getTimeRemainingToUpdate } = useContext(PubSuspendWhileTypingContext);
	const checkAgainRef = useRef<any>(null);
	const setForceUpdate = useState<null | number>(null)[1];
	const timeRemainingToUpdate = getTimeRemainingToUpdate(delay, Date.now());
	const shouldUpdate = timeRemainingToUpdate === 0;
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const memoizedValue = useMemo(() => value, [shouldUpdate]);

	const maybeClearTimeout = useCallback(() => {
		if (checkAgainRef.current) {
			clearTimeout(checkAgainRef.current);
		}
	}, []);

	// Every render, if we should not update this render, then we set a timeout to check after
	// the time specified by getTimeRemainingToUpdate.
	useEffect(() => {
		if (shouldUpdate) {
			// Do nothing
		} else {
			maybeClearTimeout();
			checkAgainRef.current = setTimeout(
				() => setForceUpdate(Date.now()),
				timeRemainingToUpdate,
			);
		}
	}, [maybeClearTimeout, setForceUpdate, shouldUpdate, timeRemainingToUpdate]);

	// Cleanup any timeout when unmounting
	useEffect(() => maybeClearTimeout);

	return shouldUpdate ? value : memoizedValue;
};
