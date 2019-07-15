import React from 'react';
import { storiesOf } from '@storybook/react';
import DashboardContent from 'containers/Dashboard/DashboardContent/';
import { AccentStyle } from 'components';
import { pubData, communityData } from 'data';

require('containers/Dashboard/dashboard.scss');

storiesOf('containers/Dashboard/DashboardContent', module).add('default', () => (
	<div id="dashboard-container">
		<AccentStyle communityData={communityData} isNavHidden={false} />

		<div style={{ padding: '20px' }}>
			<div className="right-column">
				<DashboardContent pubData={pubData} communityData={communityData} mode="settings" />
			</div>
		</div>
	</div>
));
