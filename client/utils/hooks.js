import React, { useContext } from 'react';

export const PageContext = React.createContext({});
export const usePageContext = (previewContextObject) => {
	const contextObject = useContext(PageContext);
	return previewContextObject || contextObject;
};
