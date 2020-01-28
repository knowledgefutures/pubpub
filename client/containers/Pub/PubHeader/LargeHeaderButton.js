import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./largeHeaderButton.scss');

const propTypes = {};

const LargeHeaderButton = React.forwardRef((props, ref) => {
	const { icon, children, className, outerLabel, onClick } = props;
	return (
		<Button
			className={classNames('large-header-button-component', className)}
			onClick={onClick}
			ref={ref}
		>
			<div className={classNames('button-box', !children && 'no-label')}>
				{typeof icon === 'string' ? <Icon icon={icon} iconSize={18} /> : icon}
				{children && <div className="label">{children}</div>}
			</div>
			{outerLabel && (
				<div className="outer-label">
					<div className="top">{outerLabel.top}</div>
					<div className="bottom">{outerLabel.bottom}</div>
				</div>
			)}
		</Button>
	);
});

LargeHeaderButton.propTypes = propTypes;
export default LargeHeaderButton;
