import React from 'react';
import { storiesOf } from '@storybook/react';
import FormattingBarMedia from 'components/FormattingBar/media';

const wrapperStyle = { margin: '1em', padding: '20px', border: '1px solid #CCC' };

storiesOf('components/FormattingBar/Media', module).add('default', () => (
	<div style={wrapperStyle}>
		<FormattingBarMedia />
	</div>
));
