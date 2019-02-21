import React from 'react';
import { storiesOf } from '@storybook/react';
import Landing from 'containers/Landing/Landing';
import { locationData, loginData, communityData } from '../data';

storiesOf('Containers/Landing', module).add('default', () => (
	<Landing locationData={locationData} loginData={loginData} communityData={communityData} />
));
