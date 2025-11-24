import React from 'react';

import { storiesOf } from '@storybook/react';

import { Pub } from 'containers';
import { pubData } from 'utils/storybook/data';

storiesOf('containers/Pub', module).add('default', () => (
	<Pub pubData={pubData as unknown as any} />
));
