import React from 'react';
import { storiesOf } from '@storybook/react';
import PubReview from 'containers/Pub/PubReview';
import { pubData } from 'data';

storiesOf('containers/Pub/PubReview', module).add('default', () => <PubReview pubData={pubData} />);
