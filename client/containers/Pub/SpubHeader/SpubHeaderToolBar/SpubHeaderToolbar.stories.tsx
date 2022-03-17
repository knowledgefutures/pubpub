import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';
import { TabId } from '@blueprintjs/core';

import { pubData } from 'utils/storybook/data';
import { SubmissionStatus } from 'types';

import SpubHeaderToolbar from './SpubHeaderToolbar';

const StatefulSpubHeaderToolBaraWrapper = () => {
	const [selectedTab, setSelectedTab] = useState<TabId>('instructions');
	return (
		<SpubHeaderToolbar
			selectedTab={selectedTab}
			onSelectTab={setSelectedTab}
			status={pubData.submission.status as SubmissionStatus}
			showSubmitButton={true}
			onSubmit={() => {}}
		/>
	);
};

storiesOf('containers/Pub/SpubHeader/SpubHeaderToolbar', module).add('default', () => (
	<StatefulSpubHeaderToolBaraWrapper />
));
