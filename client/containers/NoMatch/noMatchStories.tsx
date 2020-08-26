import React from 'react';
import { storiesOf } from '@storybook/react';

import NoMatch from 'containers/NoMatch/NoMatch';
import { locationData, loginData, communityData } from 'utils/storybook/data';

storiesOf('containers/NoMatch', module).add('default', () => (
	// @ts-expect-error ts-migrate(2322) FIXME: Property 'locationData' does not exist on type 'In... Remove this comment to see the full error message
	<NoMatch locationData={locationData} loginData={loginData} communityData={communityData} />
));
