import React from 'react';
import { usePageContext } from 'utils/hooks';

import { Icon } from 'components';

require('./dashboardFrame.scss');

type Props = {
	children: React.ReactNode;
	className?: string;
	controls?: React.ReactNode;
	details?: React.ReactNode;
	icon?: string;
	title?: React.ReactNode;
};

const DashboardFrame = (props: Props) => {
	const { className = '', children, controls = null, details = null, icon, title } = props;
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

export default DashboardFrame;
