import React from 'react';
import classNames from 'classnames';

import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';

import ScopePicker from './ScopePicker';

require('./sideMenu.scss');

type Props = {
	className?: string;
};

const SideMenu = (props: Props) => {
	const { className } = props;
	const {
		dashboardMenu: { menuItems },
	} = usePageContext();

	return (
		<div className={classNames('side-menu-component', className)}>
			<ScopePicker />
			<div className="content">
				{menuItems.map((item) => {
					const { title, href, active, count, icon } = item;
					return (
						<div key={title} className={classNames({ menu: true, active })}>
							<a href={href} className="content-title">
								<Icon className="side-icon" icon={icon} />
								<span className="side-text">{title}</span>
								{count ? <div className="count">{count}</div> : null}
							</a>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default SideMenu;
