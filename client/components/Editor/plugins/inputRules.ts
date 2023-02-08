import { Fragment, MarkType, NodeType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import {
	inputRules,
	wrappingInputRule,
	textblockTypeInputRule,
	smartQuotes,
	emDash,
	ellipsis,
	InputRule,
} from 'prosemirror-inputrules';

import { makeBlockMathInputRule, REGEX_BLOCK_MATH_DOLLARS } from '@benrbray/prosemirror-math';

// : (NodeType) → InputRule
// Given a blockquote node type, returns an input rule that turns `"> "`
// at the start of a textblock into a blockquote.
const blockQuoteRule = (nodeType) => wrappingInputRule(/^\s*>\s$/, nodeType);

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a number
// followed by a dot at the start of a textblock into an ordered list.
const orderedListRule = (nodeType) =>
	wrappingInputRule(
		/^(\d+)\.\s$/,
		nodeType,
		(match) => ({ order: +match[1] }),
		(match, node) => node.childCount + node.attrs.order === +match[1],
	);

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a bullet
// (dash, plush, or asterisk) at the start of a textblock into a
// bullet list.
const bulletListRule = (nodeType) => wrappingInputRule(/^\s*([-+*])\s$/, nodeType);

// : (NodeType) → InputRule
// Given a code block node type, returns an input rule that turns a
// textblock starting with three backticks into a code block.
const codeBlockRule = (nodeType) => textblockTypeInputRule(/^```$/, nodeType);

// : (NodeType) → InputRule
// Given an inline code mark type, returns an input rule that turns text wrapped in single
// backticks into inline code.
const inlineCodeRule = (markType) =>
	new InputRule(
		// \040 is the space character
		/`([^`]+)`\040/,
		(state: EditorState, match: RegExpMatchArray, start: number, end: number) => {
			const [_, content] = match;
			const fragment = Fragment.fromArray([
				state.schema.text(content, [state.schema.mark(markType)]),
				state.schema.text(' '),
			]);
			return state.tr.replaceWith(start, end, fragment);
		},
	);

// : (NodeType, number) → InputRule
// Given a node type and a maximum level, creates an input rule that
// turns up to that number of `#` characters followed by a space at
// the start of a textblock into a heading whose level corresponds to
// the number of `#` signs.
const headingRule = (nodeType, maxLevel) =>
	textblockTypeInputRule(new RegExp(`^(#{1,${maxLevel}})\\s$`), nodeType, (match) => ({
		level: match[1].length,
	}));

// : (NodeType) → InputRule
// Given a math block node type, returns an input rule that turns a
// textblock starting with one dollar sign into an inline math node.
const inlineMathRule = (
	nodeType: NodeType,
	excludingAncestorNodeTypes: NodeType[],
	excludingMarkTypes: MarkType[] = [],
) =>
	new InputRule(
		// \040 is the space character
		/\$([^$]+?)\$\040$/,
		(state: EditorState, matches: RegExpMatchArray, start: number, end: number) => {
			const [_, match] = matches;
			const resolvedStart = state.doc.resolve(start + 1); // +1 to capture non-inclusive marks
			const resolvedEnd = state.doc.resolve(end - 1); // -1 to capture non-inclusive marks
			const marksForRange = [...resolvedStart.marks(), ...resolvedEnd.marks()];
			if (marksForRange.some((mark) => excludingMarkTypes.includes(mark.type))) {
				return null;
			}
			for (let i = 0; i < resolvedStart.depth + 1; i++) {
				const parentAtDepth = resolvedStart.node(i);
				if (excludingAncestorNodeTypes.includes(parentAtDepth.type)) {
					return null;
				}
			}
			const newFragment = Fragment.fromArray([
				nodeType.create(null, nodeType.schema.text(match)),
				nodeType.schema.text(' '),
			]);
			return state.tr.replaceWith(start, end, newFragment);
		},
	);

// : (NodeType) → InputRule
// Given a math block node type, returns an input rule that turns a
// textblock starting with two dollar signs into a math block.
const blockMathRule = (nodeType) => makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, nodeType);

const HTTP_MAILTO_REGEX = new RegExp(
	// eslint-disable-next-line no-useless-escape
	/(?:(?:(https|http|ftp)+):\/\/)?(?:\S+(?::\S*)?(@))?(?:(?:([a-z0-9][a-z0-9\-]*)?[a-z0-9]+)(?:\.(?:[a-z0-9\-])*[a-z0-9]+)*(?:\.(?:[a-z]{2,})(:\d{1,5})?))(?:\/[^\s]*)?\s $/,
);

function linkRule(markType: MarkType) {
	return new InputRule(
		HTTP_MAILTO_REGEX,
		(state: EditorState, match: RegExpMatchArray, start: number, end: number) => {
			const resolvedStart = state.doc.resolve(start);
			if (!resolvedStart.parent.type.allowsMarkType(markType)) return null;
			const attrs = { type: match[2] === '@' ? 'email' : 'uri' };
			const link = match[0].substring(0, match[0].length - 1);
			const linkAttrs =
				attrs.type === 'email'
					? { href: 'mailto:' + link }
					: { href: link, target: '_blank' };
			const linkTo = markType.create(linkAttrs);
			return state.tr
				.removeMark(start, end, markType)
				.addMark(start, end, linkTo)
				.insertText(match[5], start);
		},
	);
}

// : (Schema) → Plugin
// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.
export default (schema) => {
	const rules = smartQuotes.concat(ellipsis, emDash);
	if (schema.nodes.blockquote) rules.push(blockQuoteRule(schema.nodes.blockquote));
	if (schema.nodes.ordered_list) rules.push(orderedListRule(schema.nodes.ordered_list));
	if (schema.nodes.bullet_list) rules.push(bulletListRule(schema.nodes.bullet_list));
	if (schema.nodes.code_block) rules.push(codeBlockRule(schema.nodes.code_block));
	if (schema.nodes.heading) rules.push(headingRule(schema.nodes.heading, 6));
	if (schema.nodes.math_inline)
		rules.push(
			inlineMathRule(
				schema.nodes.math_inline,
				[schema.nodes.math_inline, schema.nodes.math_display, schema.nodes.code_block],
				[schema.marks.code],
			),
		);
	if (schema.nodes.math_display) rules.push(blockMathRule(schema.nodes.math_display));
	if (schema.marks.code) rules.push(inlineCodeRule(schema.marks.code));
	if (schema.marks.link) rules.push(linkRule(schema.marks.link));
	return inputRules({ rules });
};
