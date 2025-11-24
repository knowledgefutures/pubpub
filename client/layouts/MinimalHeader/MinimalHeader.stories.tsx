import React from 'react';

import { storiesOf } from '@storybook/react';

import { locationData, loginData } from 'utils/storybook/data';

import MinimalHeader from './MinimalHeader';
import minimalHeaderData from './minimalHeaderData';

storiesOf('components/MinimalHeader', module).add('default', () => (
	<MinimalHeader {...minimalHeaderData} locationData={locationData} loginData={loginData} />
));
