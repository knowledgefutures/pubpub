import React from 'react';
import { storiesOf } from '@storybook/react';
import Branches from 'containers/Pub/PubManage/Branches';
import { pubData, communityData } from 'data';

require('containers/Pub/PubManage/pubManage.scss');

storiesOf('containers/Pub/PubManage/Branches', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Branches pubData={pubData} communityData={communityData} />
	</div>
));
