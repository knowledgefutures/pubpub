import React from 'react';
import { storiesOf } from '@storybook/react';

import Discussion from 'containers/Pub/PubDocument/PubDiscussions/Discussion';
import { pubData, discussionsData } from 'utils/storybook/data';

const [singleDiscussion] = discussionsData;

storiesOf('containers/Pub/PubDiscussions/Discussion', module).add('default', () => (
	// @ts-expect-error ts-migrate(2322) FIXME: Type '{ id: string; title: string; number: number;... Remove this comment to see the full error message
	<Discussion discussionData={singleDiscussion} pubData={pubData} />
));
