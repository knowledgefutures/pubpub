import React from 'react';
import { storiesOf } from '@storybook/react';
import PubOptionsExport from 'components/PubOptionsExport/PubOptionsExport';
import { pubData, communityData } from '../data';

require('components/PubOptions/pubOptions.scss');

storiesOf('Components/PubOptionsExport', module).add('default', () => (
	<div className="pub-options-component" style={{ padding: '20px' }}>
		<div className="right-column">
			<PubOptionsExport
				pubData={pubData}
				communityData={communityData}
				setPubData={() => {}}
			/>
		</div>
	</div>
));
