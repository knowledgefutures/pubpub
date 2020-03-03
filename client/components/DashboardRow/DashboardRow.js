/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./dashboardRow.scss');

const propTypes = {
	children: PropTypes.node,
	className: PropTypes.string,
	handle: PropTypes.node,
	href: PropTypes.string,
	icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
	onClick: PropTypes.func,
	rightSideElements: PropTypes.node,
	selected: PropTypes.bool,
	subtitle: PropTypes.node,
	title: PropTypes.node.isRequired,
};

const defaultProps = {
	children: null,
	className: '',
	handle: null,
	href: null,
	onClick: null,
	rightSideElements: null,
	selected: false,
	subtitle: null,
};

const preventNavigate = (evt) => {
	evt.stopPropagation();
	evt.preventDefault();
};

const DashboardRow = (props) => {
	const {
		children,
		className,
		handle,
		href,
		icon,
		onClick,
		rightSideElements,
		selected,
		subtitle,
		title,
	} = props;
	const [showChildren, setShowChildren] = useState(false);
	const showArrow = React.Children.count(children) > 0;
	return (
		<Button
			as="a"
			href={href}
			onClick={onClick}
			className={classNames('dashboard-row-component', className, selected && 'selected')}
		>
			{handle}
			<div className="inner">
				<div
					className={classNames({
						arrow: true,
						active: showArrow,
						opened: showChildren,
					})}
					role="button"
					tabIndex={showArrow ? 0 : -1}
					onClick={(evt) => {
						if (showArrow) {
							evt.preventDefault();
							setShowChildren(!showChildren);
						}
					}}
				>
					{showArrow && <Icon icon="caret-right" />}
				</div>
				<div className="icon">
					<Icon icon={icon} iconSize={14} />
				</div>
				<div className="left">
					<div className="title">{title}</div>
					<div className="subtitle">{subtitle}</div>
				</div>
				<div className="right" onClick={preventNavigate}>
					{rightSideElements}
				</div>
			</div>
			{showChildren && <div className="child-rows">{children}</div>}
		</Button>
	);
};

DashboardRow.propTypes = propTypes;
DashboardRow.defaultProps = defaultProps;
export default DashboardRow;
