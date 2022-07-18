import {
	inputRules,
	wrappingInputRule,
	textblockTypeInputRule,
	smartQuotes,
	emDash,
	ellipsis,
} from 'prosemirror-inputrules';

import {
	makeBlockMathInputRule,
	makeInlineMathInputRule,
	REGEX_INLINE_MATH_DOLLARS,
	REGEX_BLOCK_MATH_DOLLARS,
} from '@benrbray/prosemirror-math';

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
const inlineMathRule = (nodeType) => makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, nodeType);

// : (NodeType) → InputRule
// Given a math block node type, returns an input rule that turns a
// textblock starting with two dollar signs into a math block.
const blockMathRule = (nodeType) => makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, nodeType);

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
	if (schema.nodes.math_inline) rules.push(inlineMathRule(schema.nodes.math_inline));
	if (schema.nodes.math_display) rules.push(blockMathRule(schema.nodes.math_display));
	return inputRules({ rules });
};
