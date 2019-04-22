import React from 'react';
import { storiesOf } from '@storybook/react';
import Doi from 'containers/Pub/PubManage/Doi';
import { pubData, communityData, locationData } from 'data';

require('containers/Pub/PubManage/pubManage.scss');

storiesOf('containers/Pub/PubManage/Doi', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Doi pubData={pubData} communityData={communityData} locationData={locationData} />
	</div>
));
