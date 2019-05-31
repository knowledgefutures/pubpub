import React from 'react';
import { storiesOf } from '@storybook/react';
import PubSubmission from 'containers/Pub/PubSubmission';
import { pubData } from 'data';

storiesOf('containers/Pub/PubSubmission', module).add('default', () => (
	<div
		style={{
			padding: '50px',
		}}
	>
		<PubSubmission pubData={pubData} />
	</div>
));
