import React from 'react';
import { storiesOf } from '@storybook/react';
import { communityData } from 'utils/storybook/data';

import MinimalFooter from './MinimalFooter';
import minimalFooterData from './minimalFooterData';

storiesOf('components/MinimalFooter', module).add('default', () => (
	<MinimalFooter {...minimalFooterData} communityData={communityData} />
));
