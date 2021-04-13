import React from 'react';
import { storiesOf } from '@storybook/react';

import { collectionData } from 'utils/storybook/data';

import CollectionOverviewRow from './CollectionOverviewRow';

storiesOf('containers/DashboardOverview/CollectionOverviewRow', module).add('default', () => (
	<CollectionOverviewRow collection={collectionData as any} />
));
