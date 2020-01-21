import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./collectionsBarButton.scss');

const propTypes = {};

const CollectionsBarButton = React.forwardRef((props, ref) => {
	const { onClick, href, children, icon, rightIcon, ...restProps } = props;
	return (
		<Button
			{...restProps}
			onClick={onClick}
			href={href}
			className="collections-bar-button-component"
			ref={ref}
			tabIndex="0"
		>
			{icon && (
				<span className="left-icon-container">
					<Icon icon={icon} />
				</span>
			)}
			{children}
			{rightIcon && (
				<span className="right-icon-container">
					<Icon icon={rightIcon} />
				</span>
			)}
		</Button>
	);
});

CollectionsBarButton.propTypes = propTypes;
export default CollectionsBarButton;
