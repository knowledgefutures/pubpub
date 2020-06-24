import React, { useContext, useEffect, useState, useMemo } from 'react';
import throttle from 'lodash.throttle';

export const PageContext = React.createContext({});

export const PendingChanges = React.createContext({
	pendingPromise: (x) => x,
});

export const usePageContext = (previewContextObject) => {
	const contextObject = useContext(PageContext);
	return previewContextObject || contextObject;
};

export const usePendingChanges = () => {
	return useContext(PendingChanges);
};

export const useThrottled = (value, timeout, leading = true, trailing = true) => {
	const [throttledValue, setThrottledValue] = useState(value);
	const throttledSetState = useMemo(
		() => throttle(setThrottledValue, timeout, { leading: leading, trailing: trailing }),
		[timeout, leading, trailing],
	);

	useEffect(() => {
		throttledSetState(value);
	}, [throttledSetState, value]);

	return throttledValue;
};
