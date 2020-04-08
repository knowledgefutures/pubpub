import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { MenuConfigContext } from './menuContexts';

const propTypes = {
	config: PropTypes.object.isRequired,
	children: PropTypes.node.isRequired,
};

const MenuConfigProvider = (props) => {
	const { children, config } = props;
	const parentConfig = useContext(MenuConfigContext);
	return (
		<MenuConfigContext.Provider value={{ ...parentConfig, ...config }}>
			{children}
		</MenuConfigContext.Provider>
	);
};

MenuConfigProvider.propTypes = propTypes;
export default MenuConfigProvider;
