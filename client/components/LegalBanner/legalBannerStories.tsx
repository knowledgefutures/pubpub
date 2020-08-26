import React from 'react';
import { storiesOf } from '@storybook/react';

import { LegalBanner } from 'components';

storiesOf('components/LegalBanner', module).add('default', () => (
	// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
	<LegalBanner loginData={{ id: null }} />
));
