import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./collectionsBarButton.scss');

const propTypes = {
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
	href: PropTypes.string,
	icon: PropTypes.string,
	onClick: PropTypes.func,
	rightIcon: PropTypes.string,
};

const defaultProps = {
	className: '',
	href: null,
	icon: null,
	onClick: null,
	rightIcon: null,
};

const CollectionsBarButton = React.forwardRef((props, ref) => {
	const { children, className, href, icon, onClick, rightIcon, ...restProps } = props;
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
					<Icon icon={icon} iconSize={14} />
				</span>
			)}
			{children}
			{rightIcon && (
				<span className="right-icon-container">
					<Icon icon={rightIcon} iconSize={14} />
				</span>
			)}
		</Button>
	);
});

CollectionsBarButton.propTypes = propTypes;
CollectionsBarButton.defaultProps = defaultProps;
export default CollectionsBarButton;
