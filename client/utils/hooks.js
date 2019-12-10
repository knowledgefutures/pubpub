import React, { useContext } from 'react';

export const PageContext = React.createContext({});
export const usePageContext = () => {
	return useContext(PageContext);
};
