/* global describe, it, expect */
import { defaultFooterLinks, getNavItemsForCommunityNavigation } from '../navigation';

const pages = [
	{ title: 'Page One', slug: 'page1', id: 'page-id-1', isPublic: true },
	{ title: 'Page Two', slug: 'page2', id: 'page-id-2', isPublic: false },
	{ title: 'Page Three', slug: 'page3', id: 'page-id-3', isPublic: true },
];

const collections = [
	{
		title: 'Collection One',
		slug: 'collection1',
		id: 'collection-id-1',
		isPublic: true,
		kind: 'book',
	},
	{
		title: 'Collection Two',
		slug: 'collection2',
		id: 'collection-id-2',
		isPublic: true,
		kind: 'tag',
	},
	{
		title: 'Collection Three',
		slug: 'collection3',
		id: 'collection-id-3',
		isPublic: false,
		kind: 'issue',
	},
];

describe('getNavItemsForCommunityNavigation', () => {
	it('handles collections, pages, and links', () =>
		expect(
			getNavItemsForCommunityNavigation({
				navigation: [
					{ type: 'page', id: 'page-id-3' },
					{ type: 'collection', id: 'collection-id-3' },
					{ title: 'Oof', href: 'ftp://oof', id: '000' },
				],
				pages: pages,
				collections: collections,
			}),
		).toEqual([
			{ title: 'Page Three', href: '/page3', id: 'page-id-3' },
			{
				title: 'Collection Three',
				href: '/collection3',
				isPrivate: true,
				id: 'collection-id-3',
			},
			{ title: 'Oof', href: 'ftp://oof', isExternal: true, id: '000' },
		]));

	it('handles entries with children', () =>
		expect(
			getNavItemsForCommunityNavigation({
				navigation: [
					{ type: 'page', id: 'page-id-3' },
					{ type: 'collection', id: 'collection-id-3' },
					{
						id: '000',
						title: 'Menu',
						children: [
							{ type: 'collection', id: 'collection-id-2' },
							{ type: 'page', id: 'page-id-1' },
							{ title: 'Ouch', href: 'ftp://ouch', id: '111' },
						],
					},
					{ title: 'Oof', href: 'ftp://oof', id: '222' },
				],
				pages: pages,
				collections: collections,
			}),
		).toEqual([
			{ title: 'Page Three', href: '/page3', id: 'page-id-3' },
			{
				title: 'Collection Three',
				href: '/collection3',
				id: 'collection-id-3',
				isPrivate: true,
			},
			{
				id: '000',
				title: 'Menu',
				children: [
					{
						title: 'Collection Two',
						href: '/collection2',
						id: 'collection-id-2',
					},
					{ title: 'Page One', href: '/page1', id: 'page-id-1' },
					{
						title: 'Ouch',
						href: 'ftp://ouch',
						id: '111',
						isExternal: true,
					},
				],
			},
			{ title: 'Oof', href: 'ftp://oof', id: '222', isExternal: true },
		]));

	it('handles the default footer links as expected', () =>
		expect(
			getNavItemsForCommunityNavigation({
				navigation: defaultFooterLinks,
				collections: collections,
				pages: pages,
			}),
		).toEqual([
			{ title: 'RSS', href: '/rss.xml', id: 'rss' },
			{ title: 'Legal', href: '/legal', id: 'legal' },
		]));
});
