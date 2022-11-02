import React from 'react';
import { storiesOf } from '@storybook/react';

import DashboardReview from 'containers/DashboardReview/DashboardReview';
import { AccentStyle } from 'components';
import { communityData } from 'utils/storybook/data';

import { reviewData } from './data';

require('containers/DashboardReview/dashboardReview.scss');

storiesOf('containers/DashboardReview', module).add('default', () => (
	<div id="dashboard-container">
		<AccentStyle communityData={communityData} isNavHidden={false} />

		<div style={{ padding: '20px', maxWidth: '1240px' }}>
			<DashboardReview reviewData={reviewData as any} />
		</div>
	</div>
));
