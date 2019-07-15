import React from 'react';
import { storiesOf } from '@storybook/react';
import Managers from 'containers/Pub/PubManage/Managers';
import { pubData, communityData } from 'data';

require('containers/Pub/PubManage/pubManage.scss');

storiesOf('containers/Pub/PubManage/Managers', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Managers pubData={pubData} communityData={communityData} />
	</div>
));
