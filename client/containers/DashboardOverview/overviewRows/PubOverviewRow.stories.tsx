import React from 'react';
import { storiesOf } from '@storybook/react';

import { minimalPub } from 'utils/storybook/data';

import PubOverviewRow from './PubOverviewRow';

storiesOf('containers/DashboardOverview/PubOverviewRow', module).add('default', () => (
	<PubOverviewRow pub={minimalPub as any} />
));
