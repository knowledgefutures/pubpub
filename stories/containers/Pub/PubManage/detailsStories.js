import React from 'react';
import { storiesOf } from '@storybook/react';
import Details from 'containers/Pub/PubManage/Details';
import { pubData, communityData, locationData } from 'data';

require('containers/Pub/PubManage/pubManage.scss');

storiesOf('containers/Pub/PubManage/Details', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Details pubData={pubData} communityData={communityData} locationData={locationData} />
	</div>
));
