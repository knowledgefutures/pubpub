import React from 'react';
import { storiesOf } from '@storybook/react';
import PubReviews from 'containers/Pub/PubReviews';
import { pubData } from 'data';

storiesOf('containers/Pub/PubReviews', module).add('default', () => (
	<div
		style={{
			padding: '50px',
		}}
	>
		<PubReviews pubData={pubData} />
	</div>
));
