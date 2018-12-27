import React from 'react';
import { storiesOf } from '@storybook/react';
import PubOptionsAnalytics from 'components/PubOptionsAnalytics/PubOptionsAnalytics';
import { pubData, communityData } from '../data';

require('components/PubOptions/pubOptions.scss');

storiesOf('Components/PubOptionsAnalytics', module)
.add('default', () => (
	<div className="pub-options-component" style={{ padding: '20px' }}>
		<div className="right-column">
			<PubOptionsAnalytics
				pubData={pubData}
				communityData={communityData}
				setPubData={()=>{}}
			/>
		</div>
	</div>
));
