import React from 'react';
import classNames from 'classnames';

import { IconName, Icon } from 'components';

require('./overviewSection.scss');

type Props = {
	children: React.ReactNode;
	title: React.ReactNode;
	icon?: IconName;
	descendTitle?: boolean;
	spaced?: boolean;
};

const OverviewSection = (props: Props) => {
	const { children, icon, title, descendTitle, spaced } = props;
	return (
		<div className={classNames('overview-section-component', spaced && 'spaced')}>
			<div className={classNames('title', descendTitle && 'descending')}>
				{icon && <Icon icon={icon} iconSize={18} />}
				{title}
			</div>
			{children}
		</div>
	);
};

export default OverviewSection;
