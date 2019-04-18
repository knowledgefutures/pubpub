import React from 'react';
import { storiesOf } from '@storybook/react';
import PubFooter from 'containers/Pub/PubDocument/PubFooter';
import { pubData } from 'data';

storiesOf('containers/Pub/PubFooter', module).add('default', () => (
	<div>
		<PubFooter pubData={pubData} />
	</div>
));
