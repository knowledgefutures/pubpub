import React from 'react';
import { storiesOf } from '@storybook/react';
import SharePanel from 'containers/Pub/PubHeader/SharePanel';
import { pubData } from 'data';

storiesOf('containers/Pub/PubHeader', module).add('sharePanel', () => (
	<SharePanel pubData={pubData} />
));
