import React from 'react';
import { storiesOf } from '@storybook/react';
import DashboardCollections from 'containers/Dashboard/DashboardContent/Collections';
import { pubData, communityData } from 'data';

const emptyCommunityData = { ...communityData, collections: [] };

storiesOf('containers/Dashboard/DashboardContent/Collections', module)
	.add('default', () => (
		<div className="pub-options-component" style={{ padding: '20px' }}>
			<div className="right-column">
				<DashboardCollections pubData={pubData} communityData={communityData} />
			</div>
		</div>
	))
	.add('empty', () => (
		<div className="pub-options-component" style={{ padding: '20px' }}>
			<div className="right-column">
				<DashboardCollections pubData={pubData} communityData={emptyCommunityData} />
			</div>
		</div>
	));
