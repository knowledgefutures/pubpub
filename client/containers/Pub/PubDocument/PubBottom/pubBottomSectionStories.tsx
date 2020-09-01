import React from 'react';
import { storiesOf } from '@storybook/react';

import PubBottomSection from 'containers/Pub/PubDocument/PubBottom/PubBottomSection';

storiesOf('containers/Pub/PubDocument/PubBottom/PubBottomSection', module).add('default', () => (
	// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
	<div style={{ background: '#F6F4F4', 'min-height': '100vh' }}>
		<div style={{ width: 600, margin: 'auto' }}>
			{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'never'. */}
			<PubBottomSection title="Comments" centerItems={[867, 5309]} isExpandable={false}>
				Surprise!
			</PubBottomSection>
			{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'never'. */}
			<PubBottomSection title="References" centerItems={[867, 5309]} isSearchable={true}>
				{({ searchTerm }) =>
					searchTerm === null ? 'Try searching' : `This is the search term: ${searchTerm}`
				}
			</PubBottomSection>
		</div>
	</div>
));
