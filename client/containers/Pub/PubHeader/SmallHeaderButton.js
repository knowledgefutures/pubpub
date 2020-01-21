import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./smallHeaderButton.scss');

const propTypes = {
	className: PropTypes.string,
	href: PropTypes.string,
	label: PropTypes.string.isRequired,
	labelPosition: PropTypes.oneOf(['left', 'right']).isRequired,
	icon: PropTypes.string.isRequired,
	onClick: PropTypes.func,
};

const defaultProps = {
	className: '',
	href: null,
	onClick: null,
};

const SmallHeaderButton = (props) => {
	const { className, href, icon, label, labelPosition, onClick } = props;
	return (
		<Button
			as="a"
			href={href}
			onClick={onClick}
			className={classNames(
				'small-header-button-component',
				labelPosition === 'left' ? 'label-left' : 'label-right',
				className,
			)}
		>
			<div className="themed-box icon-container">
				<Icon icon={icon} iconSize={14} />
			</div>
			<div className="label">{label}</div>
		</Button>
	);
};

SmallHeaderButton.propTypes = propTypes;
SmallHeaderButton.defaultProps = defaultProps;
export default SmallHeaderButton;
