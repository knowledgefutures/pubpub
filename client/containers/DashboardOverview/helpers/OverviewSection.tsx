import React from 'react';
import classNames from 'classnames';

import { IconName, Icon } from 'components';

require('./overviewSection.scss');

type Props = {
	children: React.ReactNode;
	title: React.ReactNode;
	icon?: IconName;
	descendTitle?: boolean;
};

const OverviewSection = (props: Props) => {
	const { children, icon, title, descendTitle } = props;
	return (
		<div className="overview-section-component">
			<div className={classNames('title', descendTitle && 'descending')}>
				{icon && <Icon icon={icon} iconSize={18} />}
				{title}
			</div>
			{children}
		</div>
	);
};

export default OverviewSection;
