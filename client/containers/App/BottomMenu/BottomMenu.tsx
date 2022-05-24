import React from 'react';
import classNames from 'classnames';

import { Icon, MenuButton, MenuItem } from 'components';
import { usePageContext } from 'utils/hooks';
import ScopePicker from '../SideMenu/ScopePicker';

require('./bottomMenu.scss');

type Props = {
	isMobile?: boolean;
	className?: string;
};

const BottomMenu = (props: Props) => {
	const { className, isMobile } = props;
	const {
		dashboardMenu: { activeMode, menuItems },
	} = usePageContext();

	return (
		<div className={classNames('bottom-menu-component', className)}>
			<div className="content">
				<ScopePicker isMobile={isMobile} />
				<div className="mode-menu-component">
					<MenuButton
						aria-label="Dashboard Mode"
						buttonContent={<div className="current-mode">{activeMode!.mode}</div>}
						buttonProps={{
							className: 'mode-button',
							fill: true,
							minimal: true,
							rightIcon: 'caret-down',
						}}
						className="mode-menu"
						unstable_fixed
					>
						<div className="mode-dropdown-component">
							{menuItems.map((item) => {
								const { active, href, icon, title } = item;
								return (
									<MenuItem
										href={href}
										key={title}
										text={
											<div
												key={title}
												className={classNames({ menu: true, active })}
											>
												<div className="side-icon">
													<Icon icon={icon} />
												</div>
												<div className="side-text">{title}</div>
											</div>
										}
									/>
								);
							})}
						</div>
					</MenuButton>
				</div>
			</div>
		</div>
	);
};

export default BottomMenu;
