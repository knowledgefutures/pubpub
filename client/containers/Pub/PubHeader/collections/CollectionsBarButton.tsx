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
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'className' does not exist on type '{ chi... Remove this comment to see the full error message
	const { children, className, href, icon, onClick, rightIcon, ...restProps } = props;
	return (
		// @ts-expect-error ts-migrate(2769) FIXME: Property 'as' is missing in type '{ children: (str... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ children: Validator<string | number | bool... Remove this comment to see the full error message
CollectionsBarButton.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ className: string; href: null; icon: null;... Remove this comment to see the full error message
CollectionsBarButton.defaultProps = defaultProps;
export default CollectionsBarButton;
