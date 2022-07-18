import React from 'react';

const defaultMenuConfig = {
	usePortal: true,
};

type MenuContextType = {
	parentMenu: any;
	dismissMenu: () => void;
};

export const MenuContext = React.createContext<null | MenuContextType>(null);
export const MenuConfigContext = React.createContext(defaultMenuConfig);
