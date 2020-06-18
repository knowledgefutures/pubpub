import React from 'react';
import { storiesOf } from '@storybook/react';

import { Pub } from 'containers';
import { pubData, loginData, communityData, locationData } from 'utils/storybook/data';

storiesOf('containers/Pub', module).add('default', () => (
	<Pub
		communityData={communityData}
		loginData={loginData}
		locationData={locationData}
		pubData={{
			...pubData,
			mode: 'document',
		}}
	/>
));
