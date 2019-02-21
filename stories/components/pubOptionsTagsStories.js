import React from 'react';
import { storiesOf } from '@storybook/react';
import PubOptionsTags from 'components/PubOptionsTags/PubOptionsTags';
import { pubData, communityData } from '../data';

require('components/PubOptions/pubOptions.scss');

storiesOf('Components/PubOptionsTags', module).add('default', () => (
	<div className="pub-options-component" style={{ padding: '20px' }}>
		<div className="right-column">
			<PubOptionsTags pubData={pubData} communityData={communityData} setPubData={() => {}} />
		</div>
	</div>
));
