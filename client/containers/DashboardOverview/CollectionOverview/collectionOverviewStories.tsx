import React from 'react';
import { storiesOf } from '@storybook/react';

import CollectionOverview from 'containers/DashboardOverview/CollectionOverview/CollectionOverview';
import { AccentStyle } from 'components';
import { communityData, overviewData } from 'utils/storybook/data';

// require('containers/Dashboard/dashboard.scss');

storiesOf('containers/DashboardOverview/CollectionOverview', module).add('default', () => (
	<div id="dashboard-container" style={{ margin: '20px' }}>
		<AccentStyle communityData={communityData} isNavHidden={false} />
		<CollectionOverview overviewData={overviewData} />
	</div>
));
