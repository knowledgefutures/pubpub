import React from 'react';
import { storiesOf } from '@storybook/react';
import ActionButton from 'containers/Pub/PubHeader/ActionButton';

storiesOf('containers/Pub/PubHeader', module).add('actionButton', () => (
	<div
		style={{
			padding: '50px',
			display: 'flex',
			justifyContent: 'space-between',
			flexWrap: 'wrap',
		}}
	>
		<ActionButton buttons={[{ text: 'Hello' }]} isSkewed={true} />
		<ActionButton buttons={[{ text: 'Hello', icon: 'history' }]} isSkewed={true} />
		<ActionButton buttons={[{ text: 'Hello' }]} isSkewed={false} />
		<ActionButton buttons={[{ text: 'Hello' }]} isSkewed={true} />
	</div>
));
