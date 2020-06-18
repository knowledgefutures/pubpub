import React from 'react';
import { storiesOf } from '@storybook/react';

import Pricing from 'containers/Pricing/Pricing';
import { locationData, loginData, communityData } from 'utils/storybook/data';

storiesOf('containers/Pricing', module).add('default', () => (
	<Pricing locationData={locationData} loginData={loginData} communityData={communityData} />
));
