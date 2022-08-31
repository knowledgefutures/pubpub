import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';

import { spubData } from 'utils/storybook/data';

import SpubHeaderToolbar from './SpubHeaderToolbar';
import { SpubHeaderTab } from '../SpubHeader';

const StatefulSpubHeaderToolBaraWrapper = () => {
	const [selectedTab, setSelectedTab] = useState<SpubHeaderTab>('instructions');
	return (
		<SpubHeaderToolbar
			selectedTab={selectedTab}
			onSelectTab={setSelectedTab}
			submission={spubData.submission as any}
			validatedFields={{ title: true, abstract: true, description: true }}
		/>
	);
};

storiesOf('containers/Pub/SpubHeader/SpubHeaderToolbar', module).add('default', () => (
	<StatefulSpubHeaderToolBaraWrapper />
));
