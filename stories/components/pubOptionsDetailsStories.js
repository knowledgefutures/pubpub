import React from 'react';
import { storiesOf } from '@storybook/react';
import PubOptionsDetails from 'components/PubOptionsDetails/PubOptionsDetails';
import { pubData, communityData } from '../data';

require('components/PubOptions/pubOptions.scss');

storiesOf('Components/PubOptionsDetails', module).add('default', () => (
	<div className="pub-options-component" style={{ padding: '20px' }}>
		<div className="right-column">
			<PubOptionsDetails
				pubData={pubData}
				communityData={communityData}
				setPubData={() => {}}
			/>
		</div>
	</div>
));
