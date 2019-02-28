import React from 'react';
import { storiesOf } from '@storybook/react';
import PubOptionsDownload from 'components/PubOptionsDownload/PubOptionsDownload';
import { pubData, communityData } from '../data';

require('components/PubOptions/pubOptions.scss');

storiesOf('Components/PubOptionsDownload', module).add('default', () => (
	<div className="pub-options-component" style={{ padding: '20px' }}>
		<div className="right-column">
			<PubOptionsDownload
				pubData={pubData}
				communityData={communityData}
				setPubData={() => {}}
			/>
		</div>
	</div>
));
