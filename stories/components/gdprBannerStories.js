import React from 'react';
import { storiesOf } from '@storybook/react';

import GdprBanner from 'components/GdprBanner/GdprBanner';

storiesOf('components/GdprBanner', module).add('default', () => (
	<GdprBanner loginData={{ id: null }} />
));
