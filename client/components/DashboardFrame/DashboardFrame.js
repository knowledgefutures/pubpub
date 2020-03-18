import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardFrame.scss');

const propTypes = {
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
	controls: PropTypes.node,
	title: PropTypes.node,
	details: PropTypes.node,
};
const defaultProps = {
	className: '',
	title: undefined,
	details: null,
	controls: null,
};

const DashboardFrame = (props) => {
	const { className, children, controls, details, title } = props;
	const { scopeData } = usePageContext();
	const {
		elements: { activeTargetType },
	} = scopeData;

	return (
		<div className={className}>
			<div className="dashboard-content-header">
				<div className="dashboard-header-left">
					<div className="title">
						<span className="target-type">{activeTargetType}</span> {title}
					</div>
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
