import React from 'react';

import { storiesOf } from '@storybook/react';

import TwoColumnFooter from './TwoColumnFooter';
import twoColumnFooterData from './twoColumnFooterData';

storiesOf('components/TwoColumnFooter', module).add('default', () => (
	<TwoColumnFooter {...twoColumnFooterData} showEmailCallToAction showInvestorLogos />
));
