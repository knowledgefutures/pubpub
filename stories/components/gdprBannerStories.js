import React from 'react';
import { storiesOf } from '@storybook/react';

import GdprBanner from 'components/GdprBanner/GdprBanner';

import community from '../data/dataCommunity';

storiesOf('components/GdprBanner', module).add('default', () => (
	<GdprBanner communityData={community} />
));
