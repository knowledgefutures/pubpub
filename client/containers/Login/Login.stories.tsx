import React from 'react';

import { storiesOf } from '@storybook/react';

import Login from 'containers/Login/Login';
import { communityData, locationData, loginData } from 'utils/storybook/data';

storiesOf('containers/Login', module).add('default', () => (
	// @ts-expect-error ts-migrate(2322) FIXME: Type '{ locationData: { hostname: string; path: st... Remove this comment to see the full error message
	<Login locationData={locationData} loginData={loginData} communityData={communityData} />
));
