import React from 'react';

const defaultMenuConfig = {
	usePortal: true,
};

export const MenuContext = React.createContext(null);
export const MenuConfigContext = React.createContext(defaultMenuConfig);
