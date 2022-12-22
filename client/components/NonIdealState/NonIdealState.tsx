import React from 'react';
import { Classes, Icon, IconName } from '@blueprintjs/core';

require('./nonIdealState.scss');

type Props = {
	title?: string;
	icon?: IconName;
	action?: React.ReactNode;
	description?: string;
	children?: React.ReactNode;
	className?: string;
};

const NonIdealState = function (props: Props) {
	return (
		<div className={`${props.className} ${Classes.NON_IDEAL_STATE}`}>
			{props.icon && (
				<div className={Classes.NON_IDEAL_STATE_VISUAL}>
					<Icon icon={props.icon} iconSize={60} />
				</div>
			)}
			{props.title && <div className={Classes.HEADING}>{props.title}</div>}
			{props.description && <div>{props.description}</div>}
			{props.action && <>{props.action}</>}
			{props.children && <>{props.children}</>}
		</div>
	);
};

export default NonIdealState;
