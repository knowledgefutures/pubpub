import React from 'react';
import { storiesOf } from '@storybook/react';
import Social from 'containers/Pub/PubMeta/Social';
import { pubData } from 'data';

require('containers/Pub/PubMeta/pubMeta.scss');

storiesOf('containers/Pub/PubMeta/Social', module).add('default', () => (
	<div className="pub-manage-component" style={{ margin: '20px' }}>
		<Social pubData={pubData} />
	</div>
));
