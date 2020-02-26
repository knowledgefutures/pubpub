import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
	controls: PropTypes.node,
	title: PropTypes.node.isRequired,
	details: PropTypes.node,
};
const defaultProps = {
	className: '',
	details: null,
	controls: null,
};

const DashboardFrame = (props) => {
	const { className, children, controls, details, title } = props;
	return (
		<div className={className}>
			<div className="dashboard-content-header">
				<div className="dashboard-header-left">
					<div className="title">{title}</div>
					{details && <div className="details">{details}</div>}
				</div>
				<div className="dashboard-header-right">
					<div className="controls">{controls}</div>
				</div>
			</div>
			{children}
		</div>
	);
};

DashboardFrame.propTypes = propTypes;
DashboardFrame.defaultProps = defaultProps;
export default DashboardFrame;
