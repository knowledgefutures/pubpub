import React from 'react';
import { storiesOf } from '@storybook/react';

import { Header, AccentStyle } from 'components';
import { locationData, loginData } from 'utils/storybook/data';

const wrapperStyle = { margin: '2em 1em', border: '1px solid #CCC' };

const communityData = {};

// title: 'toggl',
// headerLogo: 'https://assets.pubpub.org/_testing/71551104387305.png',
// headerLinks: [],

// hideHero: true,
//	hideHeaderLogo: false,

//	heroBackgroundColor: '#d4a3e1', (default is community accent)
//	heroTextColor: '#fff', (default is community text color)
//	heroBackgroundImage: undefined,
//		useHeaderGradient: false,
//
//	heroImage: 'https://assets.pubpub.org/_testing/31551104397980.png',
//	heroTitle: 'Where did time go?',
//	heroLogo: undefined,
//	heroText: 'Turn your team on to productivity with Toggl the time tracker.',
//	heroPrimaryButton: 'Sign Up',
//		heroSecondaryButton: 'Find out more',
//	heroAlign: 'center',

storiesOf('components/Header', module).add('default', () => (
	<div>
		<AccentStyle
			communityData={{ accentColorLight: '#ffffff', accentColorDark: '#000000' }}
			isNavHidden={false}
		/>
		<div style={wrapperStyle}>
			<Header
				communityData={{
					...communityData,
					accentColorLight: '#ffffff',
					accentColorDark: '#000000',
					title: 'Hiptest',
					headerLinks: [
						{ title: 'About', url: '/about' },
						{ title: 'Pricing', url: '/pricing' },
						{
							title: 'Issues',
							children: [
								{ title: 'Issue 1 or so', url: '/whatever1' },
								{ title: 'Issue 2', url: '/whatever2' },
							],
						},
					],
					hideHero: false,
					hideHeaderLogo: false,
					heroBackgroundImage: undefined,
					heroBackgroundColor: '#FFF',
					heroTextColor: '#000000',
					headerLogo: 'https://assets.pubpub.org/_testing/01551104299949.png',
					heroImage: 'https://assets.pubpub.org/_testing/31551104270100.png',
					heroTitle: 'Get to market faster with continuous testing',
					// heroLogo: 'https://assets.pubpub.org/_testing/01551104299949.png',
					heroText:
						'From idea to production, test your product continuously with Behavior Driven Development and Agile test management.',
					heroPrimaryButton: { title: 'Start your free trial' },
					heroSecondaryButton: { title: 'Explore stuff' },
					heroAlign: undefined,
				}}
				locationData={{
					...locationData,
					path: '/',
				}}
				loginData={loginData}
			/>
		</div>
		<div style={wrapperStyle}>
			<Header
				communityData={{
					...communityData,
					accentColorLight: '#ffffff',
					accentColorDark: '#000000',
					hideHeaderLogo: false,
					title: 'WHITEOUT',
					hideHero: false,
					heroBackgroundImage: 'https://assets.pubpub.org/_testing/71551104341423.jpg',
					useHeaderGradient: true,
					heroBackgroundColor: undefined,
					heroTextColor: 'light',
					headerLogo: 'https://assets.pubpub.org/_testing/31551104320889.png',
					heroImage: undefined,
					heroTitle: undefined,
					heroLogo: 'https://assets.pubpub.org/_testing/71551104353671.png',
					heroText: undefined,
					heroPrimaryButton: undefined,
					heroSecondaryButton: undefined,
					heroAlign: 'center',
				}}
				locationData={{
					...locationData,
					path: '/',
				}}
				loginData={loginData}
			/>
		</div>
		<div style={wrapperStyle}>
			<Header
				communityData={{
					...communityData,
					accentColorLight: '#ffffff',
					accentColorDark: '#000000',
					hideHeaderLogo: false,
					title: 'Timepal',
					heroBackgroundImage: undefined,
					heroBackgroundColor: '#fdfaf4',
					heroTextColor: '#000000',
					headerLogo: 'https://assets.pubpub.org/_testing/41551104374754.png',
					heroImage: undefined,
					heroTitle: 'Automatic and manual time-tracking finally united',
					heroLogo: undefined,
					heroText: 'Stressless timekeeping became a reality',
					heroPrimaryButton: { title: 'Download Free Trial' },
					heroSecondaryButton: undefined,
					heroAlign: 'center',
				}}
				locationData={{
					...locationData,
					path: '/',
				}}
				loginData={loginData}
			/>
		</div>
		<div style={wrapperStyle}>
			<Header
				communityData={{
					...communityData,
					accentColorLight: '#ffffff',
					accentColorDark: '#000000',
					hideHeaderLogo: false,
					title: 'toggl',
					heroBackgroundImage: undefined,
					heroBackgroundColor: '#d4a3e1',
					headerLogo: 'https://assets.pubpub.org/_testing/71551104387305.png',
					heroImage: 'https://assets.pubpub.org/_testing/31551104397980.png',
					heroTitle: 'Where did time go?',
					heroLogo: undefined,
					heroText: 'Turn your team on to productivity with Toggl the time tracker.',
					heroPrimaryButton: { title: 'Sign Up' },
					heroSecondaryButton: { title: 'Find out more' },
					heroAlign: 'center',
				}}
				locationData={{
					...locationData,
					path: '/',
				}}
				loginData={loginData}
			/>
		</div>
		<div style={wrapperStyle}>
			<Header
				communityData={{
					...communityData,
					accentColorLight: '#ffffff',
					accentColorDark: '#000000',
					hideHeaderLogo: false,
					title: 'Simple Community',
					hideHero: true,
					// heroBackgroundImage: undefined,
					// heroBackgroundColor: '#d4a3e1',
					// headerLogo: 'https://assets.pubpub.org/_testing/71551104387305.png',
					// heroImage: 'https://assets.pubpub.org/_testing/31551104397980.png',
					// heroTitle: 'Where did time go?',
					// heroLogo: undefined,
					// heroText: 'Turn your team on to productivity with Toggl the time tracker.',
					// heroPrimaryButton: 'Sign Up',
					// heroSecondaryButton: 'Find out more',
					// heroAlign: 'center',
				}}
				locationData={{
					...locationData,
					path: '/',
				}}
				loginData={loginData}
			/>
		</div>
	</div>
));
