import React from 'react';
import { storiesOf } from '@storybook/react';

import { Pub } from 'containers';
import { pubReviewData } from 'utils/storybook/data';

storiesOf('containers/PubReview', module).add('default', () => (
	<Pub pubData={pubReviewData as any} />
));
