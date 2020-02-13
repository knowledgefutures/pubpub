/* eslint-disable react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react';

import PubHeaderCompact from 'containers/Pub/PubHeader/PubHeaderCompact';

import { pubData, communityData } from 'data';

storiesOf('containers/Pub/PubHeaderCompact', module).add('default', () => (
	<PubHeaderCompact
		pubData={pubData}
		communityData={communityData}
		locationData={{
			params: {},
		}}
	/>
));
