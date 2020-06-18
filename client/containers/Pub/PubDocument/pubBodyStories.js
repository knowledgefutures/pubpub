import React from 'react';
import { storiesOf } from '@storybook/react';

import PubBody from 'containers/Pub/PubDocument/PubBody';
import { pubData, fullDoc } from 'utils/storybook/data';

storiesOf('containers/Pub/PubDocument/PubBody', module).add('default', () => (
	<div style={{ padding: '2em' }}>
		<PubBody
			collabData={{}}
			pubData={{ ...pubData, initialDoc: fullDoc }}
			historyData={{ isViewingHistory: false }}
			updateLocalData={() => {}}
		/>
	</div>
));
