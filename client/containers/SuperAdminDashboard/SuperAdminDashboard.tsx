import React from 'react';
import classNames from 'classnames';

import { GridWrapper } from 'components';
import { getSuperAdminTabUrl, SuperAdminTabKind } from 'utils/superAdmin';

import { superAdminTabs } from './tabs';

require('./superAdminDashboard.scss');

type Props = {
	tabKind: SuperAdminTabKind;
	tabProps: Record<string, any>;
};

const SuperAdminDashboard = (props: Props) => {
	const { tabKind, tabProps } = props;
	const { component: TabComponent } = superAdminTabs[tabKind];

	const renderTabLinks = () => {
		return Object.keys(superAdminTabs).map((key) => {
			const { title } = superAdminTabs[key];
			return (
				<a
					className={classNames('link', tabKind === key && 'current')}
					href={getSuperAdminTabUrl(key as any)}
					key={key}
				>
					{title}
				</a>
			);
		});
	};

	return (
		<GridWrapper columnClassName="superadmin-dashboard-component">
			<h1>
				<span className="supreme">Superadmin</span> Dashboard
			</h1>
			<div className="superadmin-tab-links">{renderTabLinks()}</div>
			<TabComponent {...tabProps} />
		</GridWrapper>
	);
};

export default SuperAdminDashboard;
