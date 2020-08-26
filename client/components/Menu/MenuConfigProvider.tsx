import React, { useContext } from 'react';
import { MenuConfigContext } from './menuContexts';

type Props = {
	config: any;
	children: React.ReactNode;
};

const MenuConfigProvider = (props: Props) => {
	const { children, config } = props;
	const parentConfig = useContext(MenuConfigContext);
	return (
		<MenuConfigContext.Provider value={{ ...parentConfig, ...config }}>
			{children}
		</MenuConfigContext.Provider>
	);
};
export default MenuConfigProvider;
