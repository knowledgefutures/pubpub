import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./collectionsBarButton.scss');

const propTypes = {};

const CollectionsBarButton = React.forwardRef((props, ref) => {
	const { onClick, className, href, children, icon, rightIcon, ...restProps } = props;
	return (
		<Button
			{...restProps}
			onClick={onClick}
			href={href}
			className={classNames('collections-bar-button-component', className)}
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
