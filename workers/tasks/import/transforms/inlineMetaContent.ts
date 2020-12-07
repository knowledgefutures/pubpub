import { metaValueToString } from '@pubpub/prosemirror-pandoc';

const inlineAbstract = (abstract) => {
	if (abstract && Array.isArray(abstract.content)) {
		return [
			{
				type: 'Header',
				level: 1,
				attr: {},
				content: [{ type: 'Str', content: 'Abstract' }],
			},
			...abstract.content,
		];
	}
	return [];
};

const inlineLabeledParagraph = (label, value) => {
	if (value) {
		return [
			{
				type: 'Para',
				content: [
					{ type: 'Strong', content: [{ type: 'Str', content: label }] },
					{ type: 'Space' },
					{ type: 'Str', content: metaValueToString(value) },
				],
			},
		];
	}
	return [];
};

export const inlineMetaContent = (pandocAst) => {
	const { blocks, meta } = pandocAst;
	const { abstract, categories, keywords } = meta;
	return Object.assign(pandocAst, {
		blocks: [
			...inlineAbstract(abstract),
			...inlineLabeledParagraph('Keywords:', keywords),
			...inlineLabeledParagraph('Categories:', categories),
			...blocks,
		],
	});
};
