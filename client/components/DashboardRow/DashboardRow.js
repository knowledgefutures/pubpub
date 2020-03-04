import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';
import DashboardRowListing from './DashboardRowListing';

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
		<div
			className={classNames('dashboard-row-component', className, selected && 'selected')}
			aria-expanded={showChildren}
			role="listitem"
		>
			<div className="inner">
				<Button
					aria-label={
						showChildren ? 'Hide collection children' : 'Show collection children'
					}
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
				</Button>
				<div className="left">
					<div className="icon-and-title-container">
						{handle}
						<div className="icon">
							<Icon icon={icon} iconSize={14} />
						</div>
						<a
							className="title-and-subtitle"
							href={href}
							onClick={onClick}
							draggable="false"
						>
							<div className="title">{title}</div>
							<div className="subtitle">{subtitle}</div>
						</a>
					</div>
				</div>
				<div className="right">{rightSideElements}</div>
			</div>
			{showChildren && (
				<DashboardRowListing className="child-rows">{children}</DashboardRowListing>
			)}
		</div>
	);
};

DashboardRow.propTypes = propTypes;
DashboardRow.defaultProps = defaultProps;
export default DashboardRow;
