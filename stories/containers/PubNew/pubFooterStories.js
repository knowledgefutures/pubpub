import React from 'react';
import { storiesOf } from '@storybook/react';
import PubFooter from 'containers/PubNew/PubDocument/PubFooter';
import { pubData } from '../../data';

storiesOf('Containers/PubNew/PubFooter', module).add('default', () => (
	<div>
		<PubFooter pubData={pubData} />
	</div>
));
