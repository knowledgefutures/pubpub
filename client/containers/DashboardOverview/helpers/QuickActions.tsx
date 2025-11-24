import React from 'react';

import { Icon, type IconName } from 'components';

import './quickActions.scss';

export type QuickAction = {
	icon: IconName;
	label: React.ReactNode;
	href: string;
};

type Props = {
	actions: QuickAction[];
};

const QuickActions = (props: Props) => {
	const { actions } = props;
	return (
		<div className="quick-actions-component">
			{actions.map((action) => {
				const { icon, label, href } = action;
				return (
					<a className="quick-action" href={href} key={href}>
						<div className="icon-wrapper">
							<Icon icon={icon} iconSize={14} />
						</div>
						<div className="label">{label}</div>
					</a>
				);
			})}
		</div>
	);
};

export default QuickActions;
