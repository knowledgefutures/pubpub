import React from 'react';
import { storiesOf } from '@storybook/react';
import DashboardSettings from 'containers/Dashboard/DashboardContent/';
import { AccentStyle } from 'components';
import { accentDataDark, pubData, communityData } from 'data';

require('containers/Dashboard/dashboard.scss');

storiesOf('containers/Dashboard/DashboardContent/Settings', module).add('default', () => (
	<div id="dashboard-container">
		<AccentStyle {...accentDataDark} />

		<div style={{ padding: '20px' }}>
			<div className="right-column">
				<DashboardSettings pubData={pubData} communityData={communityData} />
			</div>
		</div>
	</div>
));
