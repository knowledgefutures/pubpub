import { buildRuleset, commonTransformers, transformUtil } from '@pubpub/prosemirror-pandoc';
import { defaultNodes, defaultMarks } from 'components/Editor/schemas';

import * as katex from 'katex';

import {
	pandocInlineToHtmlString,
	htmlStringToPandocInline,
	pandocBlocksToHtmlString,
	htmlStringToPandocBlocks,
} from './util';

const {
	bareLeafTransformer,
	contentTransformer,
	definitionListTransformer,
	docTransformer,
	listTransformer,
	nullTransformer,
	pandocPassThroughTransformer,
	pandocQuotedTransformer,
	tableTransformer,
} = commonTransformers;

const { textFromStrSpace, textToStrSpace, createAttr, intersperse, flatten } = transformUtil;

const rules = buildRuleset({
	nodes: defaultNodes,
	marks: defaultMarks,
});

// Top-level transformer for a doc
rules.transform('Doc', 'doc', docTransformer);

// Do nothing with nothing
rules.fromPandoc('Null', nullTransformer);

// Paragraphs are paragraphs. So are "Plain", until proven otherwise.
rules.transform('Para | Plain', 'paragraph', contentTransformer('Para', 'paragraph'));

rules.fromPandoc('Div', pandocPassThroughTransformer);

// I'm not really sure what a LineBlock is, but let's just call it a single paragraph
// with some hard breaks thrown in.
rules.fromPandoc('LineBlock', (node, { transform }) => {
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
	fromPandoc: (node) => {
		return {
			type: 'code_block',
			content: [{ type: 'text', text: node.content }],
		};
	},
	fromProsemirror: (node) => {
		return {
			type: 'CodeBlock',
			content: node.content.map((text) => text.text).join(''),
			attr: createAttr(''),
		};
	},
});

rules.transform('BlockQuote', 'blockquote', contentTransformer);

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
	listTransformer('list_item', ensureFirstElementIsParagraph),
);

rules.transform(
	'BulletList',
	'bullet_list',
	listTransformer('list_item', ensureFirstElementIsParagraph),
);

rules.fromPandoc('DefinitionList', definitionListTransformer('bullet_list', 'list_item'));

// Tranform headers
rules.transform('Header', 'heading', {
	fromPandoc: (node, { transform }) => {
		return {
			type: 'heading',
			attrs: {
				level: node.level,
				fixedId: node.attr.identifier,
			},
			content: transform(node.content).asArray(),
		};
	},
	fromProsemirror: (node, { transform }) => {
		return {
			type: 'Header',
			level: parseInt(node.attrs.level.toString(), 10),
			attr: createAttr(node.attrs.id.toString()),
			content: transform(node.content).asArray(),
		};
	},
});

// Transform horizontal rules
rules.transform('HorizontalRule', 'horizontal_rule', bareLeafTransformer);

// Specify all nodes that are equivalent to Prosemirror marks
rules.transformToMark('Emph', 'em');
rules.transformToMark('Strong', 'strong');
rules.transformToMark('Strikeout', 'strike');
rules.transformToMark('Superscript', 'sup');
rules.transformToMark('Subscript', 'sub');

rules.fromPandoc('Code', (node) => {
	return {
		type: 'text',
		marks: [{ type: 'code' }],
		text: node.content,
	};
});

rules.transformToMark('Link', 'link', (link, { resource }) => {
	return {
		href: resource(link.target.url, 'link'),
		title: link.target.title,
	};
});

// We don't support small caps right now
rules.fromPandoc('SmallCaps', pandocPassThroughTransformer);

// Tell the transformer how to deal with typical content-level nodes
rules.fromPandoc('(Str | Space | SoftBreak)+', (pdNodes) => {
	const text = textFromStrSpace(pdNodes);
	if (text.length > 0) {
		return {
			type: 'text',
			text: text,
		};
	}
	return [];
});

// Tell the transformer how to turn Prosemirror text back into Pandoc
rules.fromProsemirror('text', (node) => textToStrSpace(node.text));

// Deal with line breaks
rules.transform('LineBreak', 'hard_break', bareLeafTransformer);
rules.fromPandoc('SoftBreak', nullTransformer);

// Stuff we don't have equivalents for
rules.fromPandoc('Span', pandocPassThroughTransformer);

// Pandoc insists that text in quotes is actually its own node type
rules.fromPandoc('Quoted', pandocQuotedTransformer);

rules.fromPandoc('RawBlock', (node, { transform }) => {
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

rules.fromPandoc('RawInline', (node, { transform }) => {
	const { format, content } = node;
	if (format === 'html') {
		const pandocAst = htmlStringToPandocInline(content);
		return transform(pandocAst);
	}
	if (format === 'tex') {
		return {
			type: 'equation',
			attrs: {
				value: content,
				html: katex.renderToString(content, {
					displayMode: false,
					throwOnError: false,
				}),
			},
		};
	}
	return { type: 'text', text: content };
});

// Tables
rules.transform('Table', 'table', tableTransformer);

// Equations
rules.fromPandoc('Math', (node) => {
	const { mathType, content } = node;
	const isDisplay = mathType === 'DisplayMath';
	const prosemirrorType = isDisplay ? 'block_equation' : 'equation';
	return {
		type: prosemirrorType,
		attrs: {
			value: content,
			html: katex.renderToString(content, {
				displayMode: isDisplay,
				throwOnError: false,
			}),
		},
	};
});

// ~~~ Rules for images ~~~ //

rules.fromPandoc('Image', (node, { resource }) => {
	return {
		type: 'image',
		attrs: {
			url: resource(node.target.url, 'image'),
			caption: pandocInlineToHtmlString(node.content),
			// TODO(ian): is there anything we can do about the image size here?
		},
	};
});

rules.fromProsemirror('image', (node) => {
	return {
		type: 'Plain',
		content: [
			{
				type: 'Image',
				content: [],
				target: {
					url: node.attrs.url.toString(),
					title: '',
				},
				attr: createAttr(''),
			},
		],
	};
});

// ~~~ Rules for citations and footnotes ~~~ //

rules.transform('Cite', 'citation', {
	fromPandoc: (node, { count, resource }) => {
		const { citations } = node;
		return citations.map((citation) => {
			const { structuredValue, unstructuredValue } = resource(
				citation.citationId,
				'citation',
			);
			return {
				type: 'citation',
				attrs: {
					value: structuredValue || unstructuredValue,
					structuredValue: structuredValue,
					unstructuredValue: unstructuredValue,
					count: 1 + count('Cite'),
				},
			};
		});
	},
	fromProsemirror: (node) => {
		const inputHtml = node.attrs.html || node.attrs.unstructuredValue;
		const citationNumber =
			typeof node.attrs.count === 'number'
				? node.attrs.count
				: parseInt(node.attrs.count, 10);
		return {
			type: 'Cite',
			content: htmlStringToPandocInline(inputHtml),
			citations: [
				{
					citationId: '',
					citationPrefix: [],
					citationSuffix: [],
					citationNoteNum: citationNumber,
					citationHash: citationNumber,
					citationMode: 'NormalCitation',
				},
			],
		};
	},
});

rules.transform('Note', 'footnote', {
	fromPandoc: (node, { count }) => {
		const { content } = node;
		const value = pandocBlocksToHtmlString(content);
		return {
			type: 'footnote',
			attrs: {
				value: value,
				count: 1 + count('Note'),
			},
		};
	},
	fromProsemirror: (node) => {
		const noteContent = node.attrs.unstructuredValue || '';
		return {
			type: 'Note',
			content: htmlStringToPandocBlocks(noteContent),
		};
	},
});

export default rules.finish();
