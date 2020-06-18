import React from 'react';
import { storiesOf } from '@storybook/react';

import NoMatch from 'containers/NoMatch/NoMatch';
import { locationData, loginData, communityData } from 'utils/storybook/data';

storiesOf('containers/NoMatch', module).add('default', () => (
	<NoMatch locationData={locationData} loginData={loginData} communityData={communityData} />
));
