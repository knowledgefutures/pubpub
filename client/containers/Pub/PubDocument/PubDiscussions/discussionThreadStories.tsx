import React from 'react';
import { storiesOf } from '@storybook/react';

import Discussion from 'containers/Pub/PubDocument/PubDiscussions/Discussion';
import { pubData, discussionsData } from 'utils/storybook/data';

const [singleDiscussion] = discussionsData;

storiesOf('containers/Pub/PubDiscussions/Discussion', module).add('default', () => (
	// @ts-expect-error ts-migrate(2741) FIXME: Property 'updateLocalData' is missing in type '{ d... Remove this comment to see the full error message
	<Discussion discussionData={singleDiscussion} pubData={pubData} />
));
