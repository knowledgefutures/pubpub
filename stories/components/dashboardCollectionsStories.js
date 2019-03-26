import React from 'react';
import { storiesOf } from '@storybook/react';
import DashboardCollections from 'components/DashboardCollections/DashboardCollections';
import { pubData, communityData } from '../data';

storiesOf('Components/DashboardCollections', module).add('default', () => (
	<div className="pub-options-component" style={{ padding: '20px' }}>
		<div className="right-column">
			<DashboardCollections pubData={pubData} communityData={communityData} />
		</div>
	</div>
));
