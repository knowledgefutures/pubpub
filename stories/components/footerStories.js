import React from 'react';
import { storiesOf } from '@storybook/react';

import Footer from 'components/Footer/Footer';
import AccentStyle from 'components/AccentStyle/AccentStyle';
import Icon from 'components/Icon/Icon';

import { accentDataDark, accentDataLight, communityData } from '../data';

const wrapperStyle = { margin: '1em 0em' };

const customSocialItems = [
	{ id: 'si-0', icon: <Icon icon="vimeo" />, title: 'Website', value: 'custom', url: 'https://vimeo.com/custom' },
	{ id: 'si-1', icon: <Icon icon="soundcloud" />, title: 'Check out my SoundCloud', value: 'custom', url: 'https://twitter.com/custom' },
	{ id: 'si-2', icon: <Icon icon="spotify" />, title: 'Facebook', value: 'custom', url: 'https://facebook.com/}' },
];

storiesOf('Components/Footer', module)
.add('Dark', () => (
	<div>
		<AccentStyle {...accentDataDark} />

		<div style={wrapperStyle}>
			<Footer isAdmin={true} isBasePubPub={false} socialItems={customSocialItems} communityData={communityData} />
		</div>

		<div style={wrapperStyle}>
			<Footer isAdmin={false} isBasePubPub={false} socialItems={customSocialItems} communityData={communityData} />
		</div>

		<div style={wrapperStyle}>
			<Footer isAdmin={false} isBasePubPub={true} communityData={communityData} />
		</div>
	</div>
))
.add('Light', () => (
	<div>
		<AccentStyle {...accentDataLight} />
		<div style={wrapperStyle}>
			<Footer isAdmin={true} isBasePubPub={false} socialItems={customSocialItems} communityData={communityData} />
		</div>
	</div>
));
