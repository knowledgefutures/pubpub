import React from 'react';
import { storiesOf } from '@storybook/react';

import Landing from 'containers/Landing/Landing';
import { locationData, loginData, communityData } from 'utils/storybook/data';

storiesOf('containers/Landing', module).add('default', () => (
	// @ts-expect-error ts-migrate(2322) FIXME: Type '{ locationData: { hostname: string; path: st... Remove this comment to see the full error message
	<Landing locationData={locationData} loginData={loginData} communityData={communityData} />
));
