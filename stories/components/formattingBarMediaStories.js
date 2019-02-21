import React from 'react';
import { storiesOf } from '@storybook/react';
import FormattingBarMedia from 'components/FormattingBarMedia/FormattingBarMedia';

require('components/FormattingBarMedia/formattingBarMedia.scss');

const wrapperStyle = { margin: '1em', padding: '20px', border: '1px solid #CCC' };

storiesOf('Components/FormattingBarMedia', module).add('default', () => (
	<div style={wrapperStyle}>
		<FormattingBarMedia />
	</div>
));
