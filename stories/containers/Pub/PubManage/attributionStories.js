import React from 'react';
import { storiesOf } from '@storybook/react';
import Attribution from 'containers/Pub/PubManage/Attribution';
import { pubData, communityData } from 'data';

require('containers/Pub/PubManage/pubManage.scss');

storiesOf('containers/Pub/PubManage/Attribution', module)
	.add('editable', () => (
		<div className="pub-manage-component" style={{ margin: '20px' }}>
			<Attribution pubData={{ ...pubData, canManage: true }} communityData={communityData} />
		</div>
	))
	.add('read-only', () => (
		<div className="pub-manage-component" style={{ margin: '20px' }}>
			<Attribution pubData={pubData} communityData={communityData} />
		</div>
	));
