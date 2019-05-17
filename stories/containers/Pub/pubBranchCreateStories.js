import React from 'react';
import { storiesOf } from '@storybook/react';
import PubBranchCreate from 'containers/Pub/PubBranchCreate';
import { pubData } from 'data';

storiesOf('containers/Pub/PubBranchCreate', module).add('default', () => (
	<PubBranchCreate pubData={pubData} />
));
