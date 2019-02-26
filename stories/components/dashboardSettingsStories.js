import React from 'react';
import { storiesOf } from '@storybook/react';
import DashboardSettings from 'components/DashboardSettings/DashboardSettings';
import AccentStyle from 'components/AccentStyle/AccentStyle';
import { accentDataDark, pubData, communityData } from '../data';

require('containers/Dashboard/dashboard.scss');

storiesOf('Components/DashboardSettings', module).add('default', () => (
	<div id="dashboard-container">
		<AccentStyle {...accentDataDark} />

		<div style={{ padding: '20px' }}>
			<div className="right-column">
				<DashboardSettings pubData={pubData} communityData={communityData} />
			</div>
		</div>
	</div>
));
