import React from 'react';
import { storiesOf } from '@storybook/react';
import Details from 'containers/Pub/PubMeta/Details';
import { pubData } from 'data';

require('containers/Pub/PubMeta/pubMeta.scss');

storiesOf('containers/Pub/PubMeta/Details', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Details pubData={pubData} />
	</div>
));
