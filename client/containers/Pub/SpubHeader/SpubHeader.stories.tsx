import React from 'react';
import { storiesOf } from '@storybook/react';

import SpubHeader from './SpubHeader';
import './SpubHeader.stories.scss';

storiesOf('containers/Pub/SpubHeader', module).add('default', () => <SpubHeader />);
