import React from 'react';
import { storiesOf } from '@storybook/react';
import PubOptionsDoi from 'components/PubOptionsDoi/PubOptionsDoi';
import { pubData, communityData } from '../data';

require('components/PubOptions/pubOptions.scss');

storiesOf('Components/PubOptionsDoi', module).add('default', () => (
	<div className="pub-options-component" style={{ padding: '20px' }}>
		<div className="right-column">
			<PubOptionsDoi pubData={pubData} communityData={communityData} />
		</div>
	</div>
));
