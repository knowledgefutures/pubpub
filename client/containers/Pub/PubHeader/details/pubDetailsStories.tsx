import React from 'react';
import { storiesOf } from '@storybook/react';

import PubDetails from 'containers/Pub/PubHeader/details';
import { pubData } from 'utils/storybook/data';

storiesOf('containers/Pub/PubDetails', module).add('default', () => (
	// @ts-expect-error ts-migrate(2741) FIXME: Property 'onCloseHeaderDetails' is missing in type... Remove this comment to see the full error message
	<PubDetails
		communityData={{
			subdomain: 'pfffft',
		}}
		pubData={{
			...pubData,
			attributions: [
				...pubData.attributions,
				...pubData.attributions,
				...pubData.attributions,
			],
		}}
	/>
));
