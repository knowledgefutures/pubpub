import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { Icon } from 'components';
import { Menu } from './Menu';

const propTypes = {
	buttonContent: PropTypes.node,
	buttonProps: PropTypes.shape({
		icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
	}),
	children: PropTypes.node.isRequired,
};

const defaultProps = {
	buttonProps: {},
	buttonContent: null,
};

const getIconProp = (icon) => {
	if (icon && typeof icon === 'string') {
		return <Icon icon={icon} />;
	}
	return icon;
};

export const MenuButton = (props) => {
	const { buttonContent, children, buttonProps, ...restProps } = props;

	const buttonPropsWithIcon = {
		...buttonProps,
		icon: getIconProp(props.buttonProps.icon),
	};

	return (
		<Menu
			disclosure={({ ref, ...restDisclosureProps }) => (
				<Button
					children={buttonContent}
					{...buttonPropsWithIcon}
					{...restDisclosureProps}
					elementRef={ref}
				/>
			)}
			{...restProps}
		>
			{children}
		</Menu>
	);
};

MenuButton.propTypes = propTypes;
MenuButton.defaultProps = defaultProps;
