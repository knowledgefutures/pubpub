import React from 'react';
import { storiesOf } from '@storybook/react';
import Attribution from 'containers/Pub/PubManage/Attribution';
import { pubData, communityData } from 'data';

require('containers/Pub/PubManage/pubManage.scss');

storiesOf('containers/Pub/PubManage/Attribution', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Attribution pubData={pubData} communityData={communityData} />
	</div>
));
