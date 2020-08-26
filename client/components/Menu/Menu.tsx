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
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'aria-label' does not exist on type '{ ch... Remove this comment to see the full error message
		'aria-label': ariaLabel,
		children,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'className' does not exist on type '{ chi... Remove this comment to see the full error message
		className,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'disclosure' does not exist on type '{ ch... Remove this comment to see the full error message
		disclosure,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'placement' does not exist on type '{ chi... Remove this comment to see the full error message
		placement,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'onDismiss' does not exist on type '{ chi... Remove this comment to see the full error message
		onDismiss,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'gutter' does not exist on type '{ childr... Remove this comment to see the full error message
		gutter,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'menuStyle' does not exist on type '{ chi... Remove this comment to see the full error message
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
			{/* @ts-expect-error ts-migrate(2769) FIXME: Type 'unknown' is not assignable to type 'HTMLButt... Remove this comment to see the full error message */}
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
				{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ parentMenu: RK.MenuStateReturn; dismissMen... Remove this comment to see the full error message */}
				<MenuContext.Provider value={{ parentMenu: menu, dismissMenu: handleDismiss }}>
					{children}
				</MenuContext.Provider>
			</RK.Menu>
		</React.Fragment>
	);
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ 'aria-label': Validator<string>; children:... Remove this comment to see the full error message
Menu.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ className: string; gutter: undefined; menu... Remove this comment to see the full error message
Menu.defaultProps = defaultProps;
