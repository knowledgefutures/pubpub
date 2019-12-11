import TestControls from './controls/TestControls';
import ControlsCitation from './controls/ControlsCitation';

export const strong = {
	key: 'strong',
	title: 'Bold',
	icon: 'bold',
	isToggle: true,
};

export const em = {
	key: 'em',
	title: 'Italic',
	icon: 'italic',
	isToggle: true,
};

export const link = {
	key: 'link',
	title: 'Link',
	icon: 'link',
	isToggle: true,
};

export const bulletList = {
	key: 'bullet-list',
	title: 'Bullet List',
	icon: 'list-ul',
};

export const numberedList = {
	key: 'numbered-list',
	title: 'Numbered List',
	icon: 'list-ol',
};

export const blockquote = {
	key: 'blockquote',
	title: 'Blockquote',
	icon: 'citation',
};

export const code = {
	key: 'code',
	title: 'Code',
	icon: 'code',
	isToggle: true,
};

export const subscript = {
	key: 'subscript',
	title: 'Subscript',
	icon: 'subscript',
	isToggle: true,
};

export const superscript = {
	key: 'superscript',
	title: 'Superscript',
	icon: 'superscript',
	isToggle: true,
};

export const strikethrough = {
	key: 'strikethrough',
	title: 'Strikethrough',
	ariaTitle: 'strike through',
	icon: 'strikethrough',
	isToggle: true,
};

export const citation = {
	key: 'citation',
	title: 'Citation',
	icon: 'bookmark',
	controls: ControlsCitation,
};

export const discussion = {
	key: 'discussion',
	title: 'Discussion Thread',
	icon: 'chat',
};

export const equation = {
	key: 'equation',
	matchesNodes: ['equation', 'block_equation'],
	title: 'Equation',
	icon: 'function',
	controls: TestControls,
};

export const footnote = {
	key: 'footnote',
	title: 'Footnote',
	icon: 'asterisk',
};

export const horizontalRule = {
	key: 'horizontal_rule',
	title: 'Horizontal Line',
	icon: 'minus',
};

export const table = {
	key: 'table',
	title: 'Table',
	icon: 'th',
};

export const minimalButtonSet = [strong, em, link, equation];

export const fullButtonSet = [
	strong,
	em,
	link,
	bulletList,
	numberedList,
	blockquote,
	code,
	subscript,
	superscript,
	strikethrough,
	citation,
	discussion,
	equation,
	footnote,
	horizontalRule,
	table,
];
