import React from 'react';
import { storiesOf } from '@storybook/react';
import PubOptionsCite from 'components/PubOptionsCite/PubOptionsCite';
import { pubData, communityData } from '../data';

require('components/PubOptions/pubOptions.scss');

storiesOf('Components/PubOptionsCite', module)
.add('default', () => (
	<div className="pub-options-component" style={{ padding: '20px' }}>
		<div className="right-column">
			<PubOptionsCite
				pubData={pubData}
				communityData={communityData}
				setPubData={()=>{}}
			/>
		</div>
	</div>
));
