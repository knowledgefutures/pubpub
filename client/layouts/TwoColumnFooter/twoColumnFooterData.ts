import { TwoColumnFooterProps } from './TwoColumnFooter';
import { iconPaths } from './iconPaths';

const defaultTwoColumnFooterProps: TwoColumnFooterProps = {
	certification: {
		url: 'https://positiveplanet.uk/company-dashboards/elife-sciences/',
		alt: 'Positive Planet - Certified Carbon Neutral',
		imageUrl:
			'https://elifesciences.org/assets/patterns/img/patterns/molecules/carbon-neutral.706efe6d.svg',
	},
	copyright: {
		date: '2023',
		attribution: 'eLife Sciences Publications Ltd.',
		url: 'https://creativecommons.org/licenses/by/4.0/',
		type: 'Creative Commons Attribution license',
		exception: ', except where otherwise noted. ISSN: 2050-084X',
	},
	addressLines: [
		'eLife Sciences Publications, Ltd',
		'Westbrook Centre, Milton Road',
		'Cambridge CB4 1YG',
		'UK',
	],
	fullWidthLink: {
		url: 'https://github.com/elifesciences',
		path: iconPaths.github,
		text: 'Find us on GitHub',
	},
	smallPrints: [
		{
			key: 'non-profit',
			text: `
			eLife is a non-profit organisation inspired by research funders and led
			by scientists. Our mission is to help scientists accelerate discovery by
			operating a platform for research communication that encourages and
			recognises the most responsible behaviours in science.
		`,
		},
		{
			key: 'company-number',
			text: `
			eLife Sciences Publications, Ltd is a limited liability non-profit
			non-stock corporation incorporated in the State of Delaware, USA, with
			company number 5030732, and is registered in the UK with company number
			FC030576 and branch number BR015634 at the address:
		`,
		},
	],
	iconLinks: [
		{
			url: 'https://twitter.com/elife',
			ariaLabel: 'Twitter',
			pathProps: {
				d: iconPaths.twitter,
				id: 'Path',
				fill: '#000000',
				fillRule: 'nonzero',
			},
		},
		{
			url: 'https://www.facebook.com/elifesciences',
			ariaLabel: 'Facebook',
			pathProps: {
				d: iconPaths.facebook,
				id: 'Fill-1',
				fill: '#0A0B09',
			},
		},
		{
			url: 'https://www.instagram.com/elifesciences/',
			ariaLabel: 'Instagram',
			pathProps: {
				d: iconPaths.instagram,
				id: 'Shape',
				fill: '#212121',
				fillRule: 'nonzero',
			},
		},
		{
			url: 'https://www.youtube.com/channel/UCNEHLtAc_JPI84xW8V4XWyw',
			ariaLabel: 'YouTube',
			pathProps: {
				d: iconPaths.youtube,
				id: 'Combined-Shape',
				fill: '#222321',
			},
		},
		{
			url: 'https://www.linkedin.com/company/elife-sciences-publications-ltd',
			ariaLabel: 'LinkedIn',
			pathProps: {
				d: iconPaths.linkedin,
				id: 'Path_2520',
				fill: '#212121',
				fillRule: 'nonzero',
			},
		},
		{
			url: 'https://fediscience.org/@eLife',
			ariaLabel: 'Mastodon',
			pathProps: {
				d: iconPaths.mastodon,
				id: 'Combined-Shape',
				fill: '#212121', // or 000000?
				fillRule: 'nonzero',
			},
		},
	],
	links: [
		{
			text: 'About',
			url: '/about',
		},
		{
			text: 'Jobs',
			url: '/jobs',
		},
		{
			text: 'Who we work with',
			url: 'who-we-work-with',
		},
		{
			text: 'Alerts',
			url: '/alerts',
		},
		{
			text: 'Contact',
			url: '/contact',
		},
		{
			text: 'Terms and Conditions',
			url: '/terms',
		},
		{
			text: 'Privacy notice',
			url: '/privacy',
		},
		{
			text: 'Inside eLife',
			url: '/inside-elife',
		},
		{
			text: 'Monthly archive',
			url: '/archive/2023',
		},
		{
			text: 'For the press',
			url: '/for-the-press',
		},
		{
			text: 'Resources',
			url: '/resources',
		},
		{
			text: 'XML and Data',
			url: 'http://developers.elifesciences.org',
		},
	],
};

export default defaultTwoColumnFooterProps;
