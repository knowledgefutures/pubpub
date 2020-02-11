import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./largeHeaderButton.scss');

const propTypes = {};

const defaultProps = {
	icon: null,
	tagName: 'button',
};

const LargeHeaderButton = React.forwardRef((props, ref) => {
	const { icon, label, className, outerLabel, onClick, tagName, ...restProps } = props;
	const hasStackedLabel = typeof label === 'object' && label.top && label.bottom;
	return (
		<Button
			as={tagName}
			className={classNames(
				'large-header-button-component',
				'pub-header-themed-box-hover-target',
				className,
			)}
			onClick={onClick}
			ref={ref}
			{...restProps}
		>
			<div
				className={classNames('button-box', 'pub-header-themed-box', !label && 'no-label')}
			>
				{typeof icon === 'string' ? <Icon icon={icon} iconSize={22} /> : icon}
				{label && !hasStackedLabel && <div className="label">{label}</div>}
				{hasStackedLabel && (
					<div className="stacked-label">
						<div className="top">{label.top}</div>
						<div className="bottom pub-header-themed-secondary">{label.bottom}</div>
					</div>
				)}
			</div>
			{outerLabel && (
				<div className="outer-label">
					<div className="top pub-header-themed-secondary">{outerLabel.top}</div>
					<div className="bottom">{outerLabel.bottom}</div>
				</div>
			)}
		</Button>
	);
});

LargeHeaderButton.propTypes = propTypes;
LargeHeaderButton.defaultProps = defaultProps;
export default LargeHeaderButton;
