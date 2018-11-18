import React from 'react';
import { storiesOf } from '@storybook/react';
import Footer from 'components/Footer/Footer';
import AccentStyle from 'components/AccentStyle/AccentStyle';
import { accentDataDark, accentDataLight } from '../data';

const wrapperStyle = { margin: '1em 0em' };
storiesOf('Components', module)
.add('Footer - Dark', () => (
	<div>
		<AccentStyle {...accentDataDark} />

		<div style={wrapperStyle}>
			<Footer isAdmin={true} isBasePubPub={false} />
		</div>

		<div style={wrapperStyle}>
			<Footer isAdmin={false} isBasePubPub={false} />
		</div>

		<div style={wrapperStyle}>
			<Footer isAdmin={false} isBasePubPub={true} />
		</div>
	</div>
))
.add('Footer - Light', () => (
	<div>
		<AccentStyle {...accentDataLight} />
		<div style={wrapperStyle}>
			<Footer isAdmin={true} isBasePubPub={false} />
		</div>
	</div>
));
