import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { Menu } from './Menu';

const propTypes = {
	buttonContent: PropTypes.node.isRequired,
	buttonProps: PropTypes.shape({}),
	children: PropTypes.node.isRequired,
};

const defaultProps = {
	buttonProps: {},
};

export const MenuButton = (props) => {
	const { buttonProps, buttonContent, children, ...restProps } = props;
	return (
		<Menu
			disclosure={({ ref, ...restDisclosureProps }) => (
				<Button
					children={buttonContent}
					{...buttonProps}
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
