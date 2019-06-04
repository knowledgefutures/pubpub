import React from 'react';
import { storiesOf } from '@storybook/react';
import Metrics from 'containers/Pub/PubManage/Metrics';
import { pubData } from 'data';

require('containers/Pub/PubManage/pubManage.scss');

storiesOf('containers/Pub/PubMeta/Metrics', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Metrics pubData={pubData} />
	</div>
));
