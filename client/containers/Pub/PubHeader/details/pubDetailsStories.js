import React from 'react';
import { storiesOf } from '@storybook/react';

import PubDetails from 'containers/Pub/PubHeader/details';
import { pubData } from 'utils/storybook/data';

storiesOf('containers/Pub/PubDetails', module).add('default', () => (
	<PubDetails
		communityData={{
			subdomain: 'pfffft',
		}}
		pubData={{
			...pubData,
			attributions: [
				...pubData.attributions,
				...pubData.attributions,
				...pubData.attributions,
			],
		}}
	/>
));
