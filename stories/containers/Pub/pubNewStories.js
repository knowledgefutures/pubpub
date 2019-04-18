import React from 'react';
import { storiesOf } from '@storybook/react';

storiesOf('containers/Pub', module).add('default', () => (
	<div
		style={{
			padding: '50px',
			display: 'flex',
			justifyContent: 'space-between',
			flexWrap: 'wrap',
		}}
	>
		<h2>Put Pub here</h2>
	</div>
));
