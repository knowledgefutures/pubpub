import React from 'react';

import classNames from 'classnames';

import { Icon, type IconName } from 'components';
import { usePageContext } from 'utils/hooks';

import './dashboardFrame.scss';

type Props = {
	children: React.ReactNode;
	className?: string;
	controls?: React.ReactNode;
	details?: React.ReactNode;
	icon?: IconName;
	title?: React.ReactNode;
	banner?: React.ReactNode;
};

const DashboardFrame = (props: Props) => {
	const { className, children, controls = null, details = null, icon, title, banner } = props;
	const { scopeData } = usePageContext();
	const {
		elements: { activeTargetType },
	} = scopeData;

	return (
		<div className={classNames('dashboard-frame-component', className)}>
			{banner}
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
