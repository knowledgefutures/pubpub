import React from 'react';
import { storiesOf } from '@storybook/react';
import PubOptionsCollections from 'components/PubOptionsCollections/PubOptionsCollections';
import { pubData, communityData } from '../data';

require('components/PubOptions/pubOptions.scss');

storiesOf('Components/PubOptionsCollections', module).add('default', () => (
	<div className="pub-options-component" style={{ padding: '20px' }}>
		<div className="right-column">
			<PubOptionsCollections
				pubData={pubData}
				communityData={communityData}
				setPubData={() => {}}
			/>
		</div>
	</div>
));
