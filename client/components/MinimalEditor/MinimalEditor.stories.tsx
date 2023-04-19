import React from 'react';
import { storiesOf } from '@storybook/react';
import { MinimalEditor } from 'components';
import { fullDoc } from 'utils/storybook/data';

const wrapperStyle = { margin: '1em', padding: '20px', border: '1px solid #CCC' };

storiesOf('components/MinimalEditor', module).add('default', () => (
	<div>
		<div style={wrapperStyle}>
			<MinimalEditor
				getButtons={(buttons) => buttons.fullButtonSet}
				useFormattingBar={true}
				placeholder="Type here"
				initialContent={fullDoc}
			/>
		</div>
	</div>
));
