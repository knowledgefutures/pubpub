import React, { useContext } from 'react';

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
