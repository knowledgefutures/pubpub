import React from 'react';
import { storiesOf } from '@storybook/react';

import SpubHeaderTab from 'containers/Pub/SpubHeader/SpubHeaderTab';

storiesOf('containers/Pub/SpubHeader/SpubHeaderTab', module).add('default', () => (
	<SpubHeaderTab expandToFold>
		<div>spub header tab content</div>
	</SpubHeaderTab>
));
