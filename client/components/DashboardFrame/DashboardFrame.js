import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

import { Icon } from 'components';

require('./dashboardFrame.scss');

const propTypes = {
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
	controls: PropTypes.node,
	details: PropTypes.node,
	icon: PropTypes.string,
	title: PropTypes.node,
};
const defaultProps = {
	className: '',
	controls: null,
	details: null,
	icon: null,
	title: undefined,
};

const DashboardFrame = (props) => {
	const { className, children, controls, details, icon, title } = props;
	const { scopeData } = usePageContext();
	const {
		elements: { activeTargetType },
	} = scopeData;

	return (
		<div className={className}>
			<div className="dashboard-content-header">
				<div className="dashboard-header-left">
					<div className="title">
						{icon && (
							<React.Fragment>
								<Icon icon={icon} iconSize={24} />
								&nbsp;
							</React.Fragment>
						)}
						<span className="target-type">{activeTargetType}</span>&nbsp;
						{title}
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
