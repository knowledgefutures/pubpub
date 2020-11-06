import { forEachInstance } from './util';

const rewritePageLayout = (blocks) => {
	return blocks.map((block) => {
		if (block.type === 'pages') {
			const {
				content: { title, pageIds },
				id,
			} = block;
			return {
				type: 'collections-pages',
				id: id,
				content: {
					title: title,
					items: pageIds.map((pageId) => {
						return { type: 'page', id: pageId };
					}),
				},
			};
		}
		return block;
	});
};

module.exports = async ({ models }) => {
	const { Page } = models;
	await forEachInstance(
		Page,
		async (page) => {
			if (page.layout && page.layout.some((block) => block.type === 'pages')) {
				page.layout = rewritePageLayout(page.layout);
				await page.save();
			}
		},
		10,
	);
};
