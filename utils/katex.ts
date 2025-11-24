import katex, { type KatexOptions } from 'katex';

export const renderToKatexString = (tex: string, options: KatexOptions) => {
	try {
		return katex.renderToString(tex, options);
	} catch (_e: unknown) {
		return `<div class="parse-error">(math error)</div>`;
	}
};
