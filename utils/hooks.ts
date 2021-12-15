import React, { useContext, useEffect, useState, useMemo } from 'react';
import throttle from 'lodash.throttle';

import * as types from 'types';

export const PageContext = React.createContext<types.PageContext>({} as types.PageContext);

export const PendingChanges = React.createContext({
	pendingPromise: (x) => x,
});

export const usePageContext = (previewContextObject: null | types.PageContext = null) => {
	const contextObject = useContext(PageContext);
	return previewContextObject || contextObject;
};

export const usePendingChanges = () => {
	return useContext(PendingChanges);
};

export const useThrottled = (value, timeout, leading = true, trailing = true) => {
	const [throttledValue, setThrottledValue] = useState(value);
	const throttledSetState = useMemo(
		() => throttle(setThrottledValue, timeout, { leading, trailing }),
		[timeout, leading, trailing],
	);

	useEffect(() => {
		throttledSetState(value);
	}, [throttledSetState, value]);

	return throttledValue;
};
