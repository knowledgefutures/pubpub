import React from 'react';
import { storiesOf } from '@storybook/react';
import Collections from 'containers/Pub/PubManage/Collections';
import { pubData, communityData, locationData } from 'data';

require('containers/Pub/PubManage/pubManage.scss');

storiesOf('containers/Pub/PubManage/Collections', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Collections pubData={pubData} communityData={communityData} locationData={locationData} />
	</div>
));
