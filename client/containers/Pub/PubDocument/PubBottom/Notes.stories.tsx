import React from 'react';
import { storiesOf } from '@storybook/react';

import Notes from 'containers/Pub/PubDocument/PubBottom/Notes';

storiesOf('containers/Pub/PubDocument/PubBottom/Notes', module).add('default', () => (
	// @ts-expect-error ts-migrate(2322) FIXME: Type '{ background: string; 'min-height': string; ... Remove this comment to see the full error message
	<div style={{ background: '#F6F4F4', 'min-height': '100vh' }}>
		<div style={{ width: 600, margin: 'auto' }}>
			<Notes
				accentColor="#a2273e"
				notes={[
					{
						structuredValue: 'https://doi.org/10.21428/8f7503e4',
						unstructuredValue: '<p>Some text for folks.</p>',
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ structuredValue: string; unstructuredValue... Remove this comment to see the full error message
						html:
							'<div class="csl-bib-body">\n  <div data-csl-entry-id="temp_id_9869594710326501" class="csl-entry">Ito, J. (2017). Resisting Reduction: A Manifesto. <i>Journal of Design and Science</i>. https://doi.org/10.21428/8f7503e4</div>\n</div>',
					},
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ structuredValue: string; unstructuredValue... Remove this comment to see the full error message
					{ structuredValue: '', unstructuredValue: '<p>okok</p>', html: '' },
				]}
			/>
		</div>
	</div>
));
