import React from 'react';
import { storiesOf } from '@storybook/react';

import Landing from 'containers/Landing/Landing';
import { locationData, loginData, communityData } from 'utils/storybook/data';

storiesOf('containers/Landing', module).add('default', () => (
	<Landing locationData={locationData} loginData={loginData} communityData={communityData} />
));
