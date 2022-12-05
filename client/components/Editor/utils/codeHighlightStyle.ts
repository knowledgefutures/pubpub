import { defaultHighlightStyle } from '@codemirror/language';

import { DocJson } from 'types';

export const getCodeHighlightStyles = (doc: DocJson): string => {
	const hasSomeCodeBlocks = doc.content.some((node) => node.type === 'code_block');
	const highlightStyles = {
		...(hasSomeCodeBlocks && { code_block: defaultHighlightStyle }),
	};
	let css = '';
	Object.keys(highlightStyles).forEach((key) => {
		const style = highlightStyles[key];
		const rules = style.module?.getRules();
		if (rules) {
			css += rules;
		}
	});
	return css;
};
