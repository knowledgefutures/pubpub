import React from 'react';
import { storiesOf } from '@storybook/react';
import Delete from 'containers/Pub/PubManage/Delete';
import { pubData, communityData } from 'data';

require('containers/Pub/PubManage/pubManage.scss');

storiesOf('containers/Pub/PubManage/Delete', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Delete pubData={pubData} communityData={communityData} />
	</div>
));
