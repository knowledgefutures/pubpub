import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Classes } from '@blueprintjs/core';
import * as RK from 'reakit/Menu';

import { MenuContext } from './menuContext';

const propTypes = {
	'aria-label': PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
	disclosure: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
	gutter: PropTypes.number,
	menuStyle: PropTypes.shape({}),
	onDismiss: PropTypes.func,
	placement: PropTypes.string,
};

const defaultProps = {
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

export const Menu = (props) => {
	const {
		'aria-label': ariaLabel,
		children,
		disclosure,
		placement,
		onDismiss,
		gutter,
		menuStyle,
	} = props;

	const menu = RK.useMenuState({
		placement: placement,
		gutter: gutter,
		unstable_preventOverflow: false,
	});

	const handleDismiss = () => {
		menu.hide();
		onDismiss();
	};

	return (
		<React.Fragment>
			<RK.MenuDisclosure
				style={{ display: 'inline-block', WebkitAppearance: 'unset' }}
				{...menu}
			>
				{(disclosureProps) =>
					renderDisclosure(disclosure, { ...disclosureProps, 'aria-label': ariaLabel })
				}
			</RK.MenuDisclosure>
			<RK.Menu
				aria-label={ariaLabel}
				as="ul"
				style={{ zIndex: 20, ...menuStyle }}
				className={classNames(Classes.MENU, Classes.ELEVATION_1)}
				unstable_portal={true}
				{...menu}
			>
				<MenuContext.Provider value={{ parentMenu: menu, dismissMenu: handleDismiss }}>
					{children}
				</MenuContext.Provider>
			</RK.Menu>
		</React.Fragment>
	);
};

Menu.propTypes = propTypes;
Menu.defaultProps = defaultProps;
