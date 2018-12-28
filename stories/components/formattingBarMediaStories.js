import React from 'react';
import { storiesOf } from '@storybook/react';
import FormattingBarMedia from 'components/FormattingBarMedia/FormattingBarMedia';

require('components/FormattingBarMedia/formattingBarMedia.scss');


const wrapperStyle = { padding: '1em 0em' };

storiesOf('Components/FormattingBarMedia', module)
.add('default', () => (
	<div style={wrapperStyle}>
		<FormattingBarMedia />
	</div>
));
