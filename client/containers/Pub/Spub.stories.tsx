import React from 'react';
import { storiesOf } from '@storybook/react';

import { Pub } from 'containers';
import { spubData } from 'utils/storybook/data';

storiesOf('containers/Spub', module).add('default', () => (
	<Pub pubData={spubData as unknown as any} />
));
