import React from 'react';
import { storiesOf } from '@storybook/react';
import Login from 'containers/Login/Login';
import { locationData, loginData, communityData } from 'data';

storiesOf('containers/Login', module).add('default', () => (
	<Login locationData={locationData} loginData={loginData} communityData={communityData} />
));
