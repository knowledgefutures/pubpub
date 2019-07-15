import React from 'react';
import { storiesOf } from '@storybook/react';
import { Footer, AccentStyle, Icon } from 'components';
import { communityData } from 'data';

const wrapperStyle = { margin: '1em 0em' };

const customSocialItems = [
	{
		id: 'si-0',
		icon: <Icon icon="vimeo" />,
		title: 'Website',
		value: 'custom',
		url: 'https://vimeo.com/custom',
	},
	{
		id: 'si-1',
		icon: <Icon icon="soundcloud" />,
		title: 'Check out my SoundCloud',
		value: 'custom',
		url: 'https://twitter.com/custom',
	},
	{
		id: 'si-2',
		icon: <Icon icon="spotify" />,
		title: 'Facebook',
		value: 'custom',
		url: 'https://facebook.com/}',
	},
];

storiesOf('components/Footer', module)
	.add('Dark', () => (
		<div>
			<AccentStyle communityData={communityData} isNavHidden={false} />

			<div style={wrapperStyle}>
				<Footer
					isAdmin={true}
					isBasePubPub={false}
					socialItems={customSocialItems}
					communityData={communityData}
				/>
			</div>

			<div style={wrapperStyle}>
				<Footer
					isAdmin={false}
					isBasePubPub={false}
					socialItems={customSocialItems}
					communityData={communityData}
				/>
			</div>

			<div style={wrapperStyle}>
				<Footer
					isAdmin={false}
					isBasePubPub={true}
					communityData={communityData}
					socialItems={customSocialItems}
				/>
			</div>
		</div>
	))
	.add('Light', () => (
		<div>
			<AccentStyle communityData={communityData} isNavHidden={false} />
			<div style={wrapperStyle}>
				<Footer
					isAdmin={true}
					isBasePubPub={false}
					socialItems={customSocialItems}
					communityData={communityData}
				/>
			</div>
		</div>
	));
