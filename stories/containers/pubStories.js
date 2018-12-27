import React from 'react';
import { storiesOf } from '@storybook/react';
import Pub from 'containers/Pub/Pub';
import { locationData, loginData, communityData, pubData } from '../data';

storiesOf('Containers/Pub', module)
.add('default', () => (
	<Pub
		locationData={locationData}
		loginData={loginData}
		communityData={communityData}
		pubData={pubData}
	/>
));
