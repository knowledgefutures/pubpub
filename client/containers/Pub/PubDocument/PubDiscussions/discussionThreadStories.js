import React from 'react';
import { storiesOf } from '@storybook/react';

import Discussion from 'containers/Pub/PubDocument/PubDiscussions/Discussion';
import { pubData, discussionsData } from 'utils/storybook/data';

const [singleDiscussion] = discussionsData;

storiesOf('containers/Pub/PubDiscussions/Discussion', module).add('default', () => (
	<Discussion discussionData={singleDiscussion} pubData={pubData} />
));
