import React from 'react';
import { storiesOf } from '@storybook/react';
import PubMerge from 'containers/Pub/PubMerge';
import { pubData } from 'data';

storiesOf('containers/Pub/PubMerge', module).add('default', () => (
	<div
		style={{
			padding: '50px',
		}}
	>
		<PubMerge pubData={pubData} />
	</div>
));
