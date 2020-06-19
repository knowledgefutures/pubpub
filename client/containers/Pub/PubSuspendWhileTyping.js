/**
 * Used to defer the rendering of expensive components while user is typing into a pub. This reduces
 * the amount of paint time after a keypress, which lends to a more responsive editing experience :)
 */
import React, { useContext, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export const PubSuspendWhileTypingContext = React.createContext({
	markLastInput: () => {},
	getTimeRemainingToUpdate: () => 0,
});

export const PubSuspendWhileTypingProvider = (props) => {
	const [lastInputTime, setLastInputTime] = useState(null);
	const getTimeRemainingtoUpdate = (delay, currentTime) => {
		// Return 0 if a <PubSuspendWhileTyping> with delay={delay} should re-render at currentTime,
		// otherwise provide a time when we expect the component can re-render, assuming there are
		// no more keypresses.
		if (!lastInputTime) {
			return 0;
		}
		const timeSinceLastInput = currentTime - lastInputTime;
		return Math.max(0, delay - timeSinceLastInput);
	};
	return (
		<PubSuspendWhileTypingContext.Provider
			value={{
				markLastInput: () => setLastInputTime(Date.now()),
				getTimeRemainingToUpdate: getTimeRemainingtoUpdate,
			}}
		>
			{props.children}
		</PubSuspendWhileTypingContext.Provider>
	);
};

PubSuspendWhileTypingProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export const PubSuspendWhileTyping = (props) => {
	const { children, delay } = props;
	const { getTimeRemainingToUpdate } = useContext(PubSuspendWhileTypingContext);
	const checkAgainRef = useRef();
	const setForceUpdate = useState()[1];
	const timeRemainingToUpdate = getTimeRemainingToUpdate(delay, Date.now());
	const shouldUpdate = timeRemainingToUpdate === 0;

	const maybeClearTimeout = () => {
		if (checkAgainRef.current) {
			clearTimeout(checkAgainRef.current);
		}
	};

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
	}, [setForceUpdate, shouldUpdate, timeRemainingToUpdate]);

	// Cleanup any timeout when unmounting
	useEffect(() => maybeClearTimeout);

	return <MemoizedSuspend shouldUpdate={shouldUpdate}>{children}</MemoizedSuspend>;
};

PubSuspendWhileTyping.propTypes = {
	children: PropTypes.func.isRequired,
	delay: PropTypes.number.isRequired,
};

const MemoizedSuspend = React.memo(
	(props) => props.children(),
	// Return false (indicating that the memoized version is invalid) if we should update
	(_, nextProps) => !nextProps.shouldUpdate,
);

MemoizedSuspend.propTypes = {
	children: PropTypes.func.isRequired,
};
