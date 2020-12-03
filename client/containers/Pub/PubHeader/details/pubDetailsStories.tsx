import React from 'react';
import { storiesOf } from '@storybook/react';

import PubDetails from 'containers/Pub/PubHeader/details';
import { pubData } from 'utils/storybook/data';

storiesOf('containers/Pub/PubDetails', module).add('default', () => (
	<PubDetails
		communityData={{
			subdomain: 'pfffft',
		}}
		pubData={{
			...pubData,
			// @ts-expect-error ts-migrate(2322) FIXME: Type '{ attributions: ({ id: string; name: string;... Remove this comment to see the full error message
			attributions: [
				...pubData.attributions,
				...pubData.attributions,
				...pubData.attributions,
			],
		}}
	/>
));
