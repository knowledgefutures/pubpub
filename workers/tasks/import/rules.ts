import md5 from 'crypto-js/md5';
import { RuleSet, pandocUtils, transformUtils, transformers } from '@pubpub/prosemirror-pandoc';

import { editorSchema } from 'components/Editor';
import { renderToKatexString } from 'utils/katex';

const { createAttr, flatten, intersperse, textFromStrSpace, textToStrSpace } = transformUtils;

const {
	bareMarkTransformer,
	docTransformer,
	nullTransformer,
	bareContentTransformer,
	pandocPassThroughTransformer,
	createListTransformer,
	definitionListTransformer,
	bareLeafTransformer,
	pandocQuotedTransformer,
	pandocTableTransformer,
	prosemirrorTableTransformer,
} = transformers;

const {
	getPandocDocForHtmlString,
	htmlStringToPandocBlocks,
	htmlStringToPandocInline,
	pandocBlocksToHtmlString,
	pandocInlineToPlainString,
	pandocInlineToHtmlString,
} = pandocUtils;

const rules = new RuleSet(editorSchema);

// Top-level transformer for a doc
rules.transform('Doc', 'doc', docTransformer);

// Do nothing with nothing
rules.toProsemirrorNode('Null', nullTransformer);

// Paragraphs are paragraphs. So are "Plain", until proven otherwise.
rules.transform('Para | Plain', 'paragraph', bareContentTransformer('Para', 'paragraph'));

// Divs are just boxes of other content
rules.toProsemirrorNode('Div', pandocPassThroughTransformer);

// I'm not really sure what a LineBlock is, but let's just call it a single paragraph
// with some hard breaks thrown in.
rules.toProsemirrorNode('LineBlock', (node, { transform }) => {
	const lines = node.content.map((line) => transform(line).asArray());
	return {
		type: 'paragraph',
		content: flatten(
			intersperse(lines, () => ({
				type: 'hard_break',
			})),
		),
	};
});

rules.transform('CodeBlock', 'code_block', {
	toProsemirrorNode: (node) => {
		return {
			type: 'code_block',
			content: [{ type: 'text', text: node.content }],
		};
	},
	fromProsemirrorNode: (node) => {
		return {
			type: 'CodeBlock',
			content: node.content.map((text) => text.text).join(''),
			attr: createAttr(),
		};
	},
});

rules.transform('BlockQuote', 'blockquote', bareContentTransformer);

// Use a listTransformer to take care of OrderedList and BulletList
const ensureFirstElementIsParagraph = (listItem) => {
	if (listItem.content.length === 0 || listItem.content[0].type !== 'paragraph') {
		listItem.content.unshift({ type: 'paragraph', content: [] });
	}
	return listItem;
};

rules.transform(
	'OrderedList',
	'ordered_list',
	createListTransformer('list_item', ensureFirstElementIsParagraph),
);

rules.transform(
	'BulletList',
	'bullet_list',
	createListTransformer('list_item', ensureFirstElementIsParagraph),
);

rules.toProsemirrorNode('DefinitionList', definitionListTransformer('bullet_list', 'list_item'));

// Tranform headers
rules.transform('Header', 'heading', {
	toProsemirrorNode: (node, { transform }) => {
		const { attr } = node;
		return {
			type: 'heading',
			attrs: {
				level: node.level,
				id: attr.identifier,
				fixedId: attr.identifier,
			},
			content: transform(node.content).asArray(),
		};
	},
	fromProsemirrorNode: (node, { transform }) => {
		return {
			type: 'Header',
			level: Number(node.attrs.level),
			attr: createAttr(node.attrs.id),
			content: transform(node.content).asArray(),
		};
	},
});

rules.transform('HorizontalRule', 'horizontal_rule', bareLeafTransformer);

const bareMarkTransformPairs = [
	['Strong', 'strong'],
	['Emph', 'em'],
	['Strikeout', 'strike'],
	['Superscript', 'sup'],
	['Subscript', 'sub'],
] as const;

bareMarkTransformPairs.forEach(([from, to]) => rules.transform(from, to, bareMarkTransformer));

rules.transform('Code', 'code', {
	toProsemirrorMark: () => {
		return {
			type: 'code',
		};
	},
	fromProsemirrorMark: (_, content) => {
		return {
			type: 'Code',
			attr: createAttr(),
			content: pandocInlineToPlainString(content),
		};
	},
});

rules.transform('Link', 'link', {
	toProsemirrorMark: (node) => {
		return {
			type: 'link',
			attrs: {
				href: node.target.url,
				title: node.target.title,
			},
		};
	},
	fromProsemirrorMark: (node, content) => {
		return {
			type: 'Link',
			attr: createAttr(),
			content,
			target: {
				url: String(node.attrs.href),
				title: String(node.attrs.title),
			},
		};
	},
});

// We don't support small caps right now
rules.toProsemirrorNode('SmallCaps', pandocPassThroughTransformer);

// Tell the transformer how to deal with typical content-level nodes
rules.toProsemirrorNode('(Str | Space | SoftBreak)+', (nodes) => {
	const text = textFromStrSpace(nodes);
	if (text.length > 0) {
		return {
			type: 'text',
			text,
		};
	}
	return [];
});

// Tell the transformer how to turn Prosemirror text back into Pandoc
rules.fromProsemirrorNode('text', (node) => textToStrSpace(node.text));

// Deal with line breaks
rules.transform('LineBreak', 'hard_break', bareLeafTransformer);

// Stuff we don't have equivalents for
rules.toProsemirrorNode('Span', pandocPassThroughTransformer);
rules.toProsemirrorNode('Underline', pandocPassThroughTransformer);

// Anything in quotation marks is its own node, to Pandoc
rules.toProsemirrorNode('Quoted', pandocQuotedTransformer);

rules.toProsemirrorNode('RawBlock', (node, { transform }) => {
	const { format, content } = node;
	if (format === 'html') {
		const pandocAst = htmlStringToPandocBlocks(content);
		return transform(pandocAst).asArray();
	}
	return {
		type: 'paragraph',
		content: [{ type: 'text', text: content }],
	};
});

rules.toProsemirrorNode('RawInline', (node, { transform }) => {
	const { format, content } = node;
	if (format === 'html') {
		const pandocAst = htmlStringToPandocInline(content);
		return transform(pandocAst).asArray();
	}
	if (format === 'tex') {
		return {
			type: 'equation',
			attrs: {
				value: content,
				html: renderToKatexString(content, {
					displayMode: false,
					throwOnError: false,
				}),
			},
		};
	}
	return { type: 'text', text: content };
});

// These next rules for images don't use transform() because they're not inverses of each other --
// the Prosemirror->Pandoc direction wraps an Image in a Para to make it block-level

rules.toProsemirrorNode('Image', (node, { resources }) => {
	return {
		type: 'image',
		attrs: {
			id: node.attr.identifier,
			url: resources.image(node.target.url),
			caption: pandocInlineToHtmlString(node.content),
			align: 'full',
		},
	};
});

rules.fromProsemirrorNode('image', (node) => {
	const maybeAltTextDoc = getPandocDocForHtmlString(node.attrs.altText as string);
	const altTextInlines = maybeAltTextDoc.blocks[0]?.content ?? [];
	const captionBlocks = htmlStringToPandocBlocks(node.attrs.caption as string);
	const imageWrappedInPlain = {
		type: 'Plain',
		content: [
			{
				type: 'Image',
				content: altTextInlines,
				target: {
					url: node.attrs.url.toString(),
					title: '',
				},
				attr: createAttr(node.attrs.id),
			},
		],
	};
	if (captionBlocks.length > 0) {
		return [imageWrappedInPlain, ...captionBlocks];
	}
	return imageWrappedInPlain;
});

rules.transform('Cite', 'citation', {
	toProsemirrorNode: (node, { resources }) => {
		const { citations } = node;
		return citations.map((citation) => {
			const { structuredValue, unstructuredValue } = resources.citation(citation.citationId);
			const customLabel = node.content.length && pandocInlineToPlainString(node.content);
			const customLabelAttrs = customLabel ? { customLabel } : {};
			return {
				type: 'citation',
				attrs: {
					value: structuredValue,
					unstructuredValue,
					...customLabelAttrs,
				},
			};
		});
	},
	fromProsemirrorNode: (node, { count, resources }) => {
		const { unstructuredValue, html } = node.attrs;
		const inputHtml = (html || unstructuredValue) as string;
		const citationNumber = 1 + count('citation');
		const { id } = resources.note(node.attrs.id);
		return {
			type: 'Cite',
			content: htmlStringToPandocInline(inputHtml),
			citations: [
				{
					citationPrefix: [],
					citationSuffix: [],
					citationId: id,
					citationHash: parseInt(md5(id).toString().slice(0, 8), 16),
					citationNoteNum: citationNumber,
					citationMode: 'NormalCitation',
				},
			],
		};
	},
});

rules.transform('Note', 'footnote', {
	toProsemirrorNode: (node, { count }) => {
		const { content } = node;
		return {
			type: 'footnote',
			attrs: {
				value: pandocBlocksToHtmlString(content),
				count: 1 + count('Note'),
			},
		};
	},
	fromProsemirrorNode: (node, { resources }) => {
		const { value: unstructuredValue } = node.attrs;
		const { unstructuredHtml } = resources.note(node.attrs.id);
		const unstructuredBlocks = unstructuredValue && htmlStringToPandocBlocks(unstructuredValue);
		const structuredBlocks = unstructuredHtml && htmlStringToPandocBlocks(unstructuredHtml);
		const content = [structuredBlocks, unstructuredBlocks].reduce(
			(acc, next) => [...acc, ...(next || [])],
			[],
		);
		return {
			type: 'Note',
			content,
		};
	},
});

rules.toProsemirrorNode('Math', (node) => {
	const { mathType, content } = node;
	const isDisplay = mathType === 'DisplayMath';
	const prosemirrorType = isDisplay ? 'math_display' : 'math_inline';
	return {
		type: prosemirrorType,
		content: [{ type: 'text', text: content }],
	};
});

rules.fromProsemirrorNode('equation', (node) => {
	return {
		type: 'Math',
		mathType: 'InlineMath',
		content: node.attrs.value.toString(),
	};
});

rules.fromProsemirrorNode('block_equation', (node) => {
	return {
		type: 'Plain',
		content: [
			{
				type: 'Math',
				mathType: 'DisplayMath',
				content: node.attrs.value.toString(),
			},
		],
	};
});

rules.fromProsemirrorNode('math_inline', (node) => {
	const content = node.content.reduce((memo, textNode) => memo + textNode.text, '');
	return {
		type: 'Math',
		mathType: 'InlineMath',
		content,
	};
});

rules.fromProsemirrorNode('math_display', (node) => {
	const content = node.content.reduce((memo, textNode) => memo + textNode.text, '');
	return {
		type: 'Plain',
		content: [
			{
				type: 'Math',
				mathType: 'DisplayMath',
				content,
			},
		],
	};
});

rules.toProsemirrorNode('Table', pandocTableTransformer);
rules.fromProsemirrorNode('table', prosemirrorTableTransformer);

rules.fromProsemirrorNode('reference', (node) => {
	return {
		type: 'Link',
		attr: createAttr(),
		content: textToStrSpace(node.attrs.label ?? ''),
		target: {
			url: `#${node.attrs.targetId}`,
			title: '',
		},
	};
});

rules.fromProsemirrorNode(
	'file | iframe | video | audio | highlightQuote | citationList | footnoteList | discussion',
	(node) => {
		return {
			type: 'Para',
			content: textToStrSpace(`[${node.type} element]`),
		};
	},
);

rules.validate();

export { rules };
