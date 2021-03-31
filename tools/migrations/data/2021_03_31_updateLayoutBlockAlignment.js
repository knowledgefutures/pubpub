/* eslint-disable no-console */
import { Collection, Page } from 'server/models';

import { forEachInstance } from '../util';

const alignableBlockTypes = ['paragraph', 'ordered_list', 'bullet_list', 'heading'];

const centerAlignBlock = (block) => {
	if (alignableBlockTypes.includes(block.type)) {
		return {
			...block,
			attrs: {
				...block.attrs,
				textAlign: 'center',
			},
		};
	}
	return block;
};

const centerAlignDocJson = (docJson) => {
	return {
		...docJson,
		content: docJson.content.map(centerAlignBlock),
	};
};

const getUpdatedLayoutBlockOrNull = (layoutBlock) => {
	const { type, content } = layoutBlock;
	if (type === 'text') {
		const { text, align } = content;
		if (align === 'center') {
			return {
				...layoutBlock,
				content: {
					...content,
					text: centerAlignDocJson(text),
				},
			};
		}
	}
	return null;
};

const getUpdatedLayoutBlocks = (layout) => {
	let updated = false;
	const layoutBlocks = layout.map((layoutBlock) => {
		const updatedBlock = getUpdatedLayoutBlockOrNull(layoutBlock);
		if (updatedBlock) {
			updated = true;
			return updatedBlock;
		}
		return layoutBlock;
	});
	return [updated, layoutBlocks];
};

const handlePage = async (page) => {
	const { layout, title } = page;
	if (Array.isArray(layout)) {
		const [updated, nextLayout] = getUpdatedLayoutBlocks(layout);
		if (updated) {
			console.log('updating Page:', title);
			page.layout = nextLayout;
			await page.save();
		}
	}
};

const handleCollection = async (collection) => {
	const { layout, title } = collection;
	if (layout && Array.isArray(layout.blocks)) {
		const [updated, nextBlocks] = getUpdatedLayoutBlocks(layout.blocks);
		if (updated) {
			console.log('updating Collection:', title);
			const nextLayout = { ...layout, blocks: nextBlocks };
			collection.layout = nextLayout;
			await collection.save();
		}
	}
};

module.exports = async () => {
	await forEachInstance(Page, handlePage);
	await forEachInstance(Collection, handleCollection);
};
