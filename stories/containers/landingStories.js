import React from 'react';
import { storiesOf } from '@storybook/react';
import Landing from 'containers/Landing/Landing';
import { locationData, loginData, communityData } from '../data';

storiesOf('Containers', module)
.add('Landing', () => (
	<Landing
		locationData={locationData}
		loginData={loginData}
		communityData={communityData}
	/>
));
