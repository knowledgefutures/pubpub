import React from 'react';
import { storiesOf } from '@storybook/react';
import { MinimalEditor } from 'components';

const wrapperStyle = { margin: '1em', padding: '20px', border: '1px solid #CCC' };

storiesOf('components/MinimalEditor', module).add('default', () => (
	<div>
		<div style={wrapperStyle}>
			<MinimalEditor focusOnLoad={true} />
		</div>
		<div style={wrapperStyle}>
			{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'undefined... Remove this comment to see the full error message */}
			<MinimalEditor useFormattingBar={true} placeholder="Yippie" />
		</div>
	</div>
));
