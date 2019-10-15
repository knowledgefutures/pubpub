import React from 'react';
import { storiesOf } from '@storybook/react';
import Dash from 'containers/Dash/Dash';
import { locationData, loginData, communityData, pubData } from '../data';

storiesOf('Containers', module).add('Dash', () => (
	<Dash
		locationData={locationData}
		loginData={loginData}
		communityData={communityData}
		pubData={pubData}
	/>
));
