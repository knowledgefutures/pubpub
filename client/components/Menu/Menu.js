import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Classes } from '@blueprintjs/core';
import * as RK from 'reakit/Menu';

import { MenuContext, MenuConfigContext } from './menuContexts';

const propTypes = {
	'aria-label': PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
	disclosure: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
	gutter: PropTypes.number,
	menuStyle: PropTypes.shape({}),
	onDismiss: PropTypes.func,
	placement: PropTypes.string,
};

const defaultProps = {
	className: '',
	gutter: undefined,
	menuStyle: {},
	onDismiss: () => {},
	placement: undefined,
};

const renderDisclosure = (disclosure, disclosureProps) => {
	if (typeof disclosure === 'function') {
		return disclosure(disclosureProps);
	}
	return React.cloneElement(disclosure, disclosureProps);
};

export const Menu = React.forwardRef((props, ref) => {
	const {
		'aria-label': ariaLabel,
		children,
		className,
		disclosure,
		placement,
		onDismiss,
		gutter,
		menuStyle,
		...restProps
	} = props;

	const menuConfig = useContext(MenuConfigContext);

	const menu = RK.useMenuState({
		placement: placement,
		gutter: gutter,
		unstable_preventOverflow: false,
		unstable_flip: false,
	});

	const handleDismiss = () => {
		menu.hide();
		onDismiss();
	};

	return (
		<React.Fragment>
			<RK.MenuDisclosure
				ref={ref}
				style={{ display: 'inline-flex', WebkitAppearance: 'unset' }}
				{...menu}
				{...restProps}
			>
				{(disclosureProps) =>
					renderDisclosure(disclosure, { ...disclosureProps, 'aria-label': ariaLabel })
				}
			</RK.MenuDisclosure>
			<RK.Menu
				aria-label={ariaLabel}
				as="ul"
				style={{ zIndex: 20, ...menuStyle }}
				className={classNames(Classes.MENU, Classes.ELEVATION_1, className)}
				unstable_portal={menuConfig.usePortal}
				{...menu}
			>
				<MenuContext.Provider value={{ parentMenu: menu, dismissMenu: handleDismiss }}>
					{children}
				</MenuContext.Provider>
			</RK.Menu>
		</React.Fragment>
	);
});

Menu.propTypes = propTypes;
Menu.defaultProps = defaultProps;
