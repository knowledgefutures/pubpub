import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./smallHeaderButton.scss');

const propTypes = {
	className: PropTypes.string,
	disabled: PropTypes.bool,
	href: PropTypes.string,
	icon: PropTypes.string.isRequired,
	label: PropTypes.string,
	labelPosition: PropTypes.oneOf(['left', 'right']),
	onClick: PropTypes.func,
	tagName: PropTypes.string,
};

const defaultProps = {
	className: '',
	disabled: false,
	href: null,
	label: null,
	onClick: null,
	tagName: 'button',
	labelPosition: 'left',
};

const SmallHeaderButton = React.forwardRef((props, ref) => {
	const { className, disabled, href, icon, label, labelPosition, onClick, tagName } = props;
	return (
		<Button
			as={tagName}
			href={href}
			ref={ref}
			onClick={onClick}
			className={classNames(
				'small-header-button-component',
				'pub-header-themed-box-hover-target',
				labelPosition === 'left' ? 'label-left' : 'label-right',
				disabled && 'disabled',
				className,
			)}
		>
			<div className="pub-header-themed-box icon-container">
				<Icon icon={icon} iconSize={14} />
			</div>
			{label && <div className="label">{label}</div>}
		</Button>
	);
});

SmallHeaderButton.propTypes = propTypes;
SmallHeaderButton.defaultProps = defaultProps;
export default SmallHeaderButton;
