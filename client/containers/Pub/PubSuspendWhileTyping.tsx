/**
 * Used to defer the rendering of expensive components while user is typing into a pub. This reduces
 * the amount of paint time after a keypress, which lends to a more responsive editing experience :)
 */
import React, { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

export const PubSuspendWhileTypingContext = React.createContext({
	markLastInput: () => {},
	getTimeRemainingToUpdate: () => 0,
});

type PubSuspendWhileTypingProviderProps = {
	children: React.ReactNode;
};

export const PubSuspendWhileTypingProvider = (props: PubSuspendWhileTypingProviderProps) => {
	const lastInputTime = useRef(null);

	const getTimeRemainingToUpdate = useCallback((delay, currentTime) => {
		// Return 0 if a <PubSuspendWhileTyping> with delay={delay} should re-render at currentTime,
		// otherwise provide a time when we expect the component can re-render, assuming there are
		// no more keypresses.
		if (!lastInputTime.current) {
			return 0;
		}
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		const timeSinceLastInput = currentTime - lastInputTime.current;
		return Math.max(0, delay - timeSinceLastInput);
	}, []);

	const markLastInput = useCallback(() => {
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'null'.
		lastInputTime.current = Date.now();
	}, []);

	const value = useMemo(() => {
		return { markLastInput: markLastInput, getTimeRemainingToUpdate: getTimeRemainingToUpdate };
	}, [getTimeRemainingToUpdate, markLastInput]);

	return (
		// @ts-expect-error ts-migrate(2322) FIXME: Type '(delay: any, currentTime: any) => number' is... Remove this comment to see the full error message
		<PubSuspendWhileTypingContext.Provider value={value}>
			{props.children}
		</PubSuspendWhileTypingContext.Provider>
	);
};

type PubSuspendWhileTypingProps = {
	children: (...args: any[]) => any;
	delay: number;
};

export const PubSuspendWhileTyping = (props: PubSuspendWhileTypingProps) => {
	const { children, delay } = props;
	const { getTimeRemainingToUpdate } = useContext(PubSuspendWhileTypingContext);
	const checkAgainRef = useRef();
	const setForceUpdate = useState()[1];
	// @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 2.
	const timeRemainingToUpdate = getTimeRemainingToUpdate(delay, Date.now());
	const shouldUpdate = timeRemainingToUpdate === 0;

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
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Timeout' is not assignable to type 'undefine... Remove this comment to see the full error message
			checkAgainRef.current = setTimeout(
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
				() => setForceUpdate(Date.now()),
				timeRemainingToUpdate,
			);
		}
	}, [maybeClearTimeout, setForceUpdate, shouldUpdate, timeRemainingToUpdate]);

	// Cleanup any timeout when unmounting
	useEffect(() => maybeClearTimeout);

	// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
	return <MemoizedSuspend shouldUpdate={shouldUpdate}>{children}</MemoizedSuspend>;
};

const MemoizedSuspend = React.memo(
	// @ts-expect-error ts-migrate(2723) FIXME: Cannot invoke an object which is possibly 'null' o... Remove this comment to see the full error message
	(props) => props.children(),
	// Return false (indicating that the memoized version is invalid) if we should update
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'shouldUpdate' does not exist on type 'Re... Remove this comment to see the full error message
	(_, nextProps) => !nextProps.shouldUpdate,
);

// @ts-expect-error ts-migrate(2339) FIXME: Property 'propTypes' does not exist on type 'Named... Remove this comment to see the full error message
MemoizedSuspend.propTypes = {
	children: PropTypes.func.isRequired,
};
