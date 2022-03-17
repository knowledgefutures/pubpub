import React from 'react';
import { storiesOf } from '@storybook/react';
import { PubPageData, DefinitelyHas } from 'types';

import { pubData } from 'utils/storybook/data';
import { initialHistoryData } from 'client/components/PubHistoryViewer/PubHistoryViewer.stories';

import SpubHeader from './SpubHeader';
import './SpubHeader.stories.scss';

storiesOf('containers/Pub/SpubHeader', module).add('default', () => (
	<SpubHeader
		pubData={pubData as unknown as DefinitelyHas<PubPageData, 'submission'>}
		historyData={initialHistoryData}
		updateLocalData={() => {}}
	/>
));
