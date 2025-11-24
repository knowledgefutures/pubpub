import type { CollapsibleHeaderProps } from './CollapsibleHeader';

export default {
	logo: {
		titleText: 'Biophysics Colab home page',
		url: '/',
		sourceProps: {
			srcSet: 'https://sciety.org/static/images/home-page/biophysics-colab.png',
			type: 'image/png',
		},
		imgProps: {
			src: 'https://sciety.org/static/images/home-page/biophysics-colab.png',
			alt: 'Biophysics Colab logo',
		},
	},
	headerNavLeft: [
		{ url: '/', title: 'Home' },
		{ url: '/about', title: 'About' },
	],
	headerNavRight: [
		{ title: 'Search', url: '/search', icon: 'search' },
		{ title: 'Submit your research', url: '/submit-your-research', isButton: true },
	],
	menuNav: [
		[
			{ isMobileOnly: true, url: '/', title: 'Home' },
			{ isMobileOnly: true, url: '/about', title: 'About' },
			{ isMobileOnly: false, url: '/inside-elife', title: 'Inside eLife' },
		],
		[
			{ isMobileOnly: true, url: '/search', title: 'Search' },
			{ isMobileOnly: true, url: '/content-alerts', title: 'Subscribe to alerts' },
		],
		[
			{
				isMobileOnly: true,
				url: 'https://elifesciences.org/submit-your-research',
				title: 'Submit your research',
			},
			{
				isMobileOnly: false,
				url: 'https://reviewer.elifesciences.org/author-guide/editorial-process',
				title: 'Author guide',
			},
			{
				isMobileOnly: false,
				url: 'https://reviewer.elifesciences.org/reviewer-guide/review-process',
				title: 'Reviewer guide',
			},
		],
	],
	twitterUrl: '',
} as CollapsibleHeaderProps;
