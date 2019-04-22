import React from 'react';
import { storiesOf } from '@storybook/react';
import Download from 'containers/Pub/PubMeta/Download';
import { pubData } from 'data';

require('containers/Pub/PubMeta/pubMeta.scss');

storiesOf('containers/Pub/PubMeta/Download', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Download pubData={pubData} />
	</div>
));
