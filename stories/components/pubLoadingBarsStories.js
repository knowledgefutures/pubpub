import React from 'react';
import { storiesOf } from '@storybook/react';
import PubLoadingBars from 'components/PubLoadingBars/PubLoadingBars';

storiesOf('Components/PubLoadingBars', module).add('default', () => (
	<div style={{ padding: '20px', width: '100%' }}>
		<PubLoadingBars />
	</div>
));
