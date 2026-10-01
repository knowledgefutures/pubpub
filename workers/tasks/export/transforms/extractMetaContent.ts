/**
 * Concatenated text of a pandoc inline list. Pandoc splits a heading into
 * several inlines whenever marks or spaces are involved, so requiring a single
 * `Str` (as this did) rejected headings the DocJson matchers accept.
 */
const inlineText = (inlines): string =>
	(inlines ?? [])
		.map((inline) => (inline?.type === 'Str' ? (inline.content ?? '') : ' '))
		.join('');

/**
 * Pandoc-AST twin of `matchAbstract` in utils/pub/abstract.ts. Kept in sync with
 * it by hand — same predicate, different data structure. Note it also strips the
 * abstract from `body`, so the heading and paragraph are not repeated in the
 * exported document.
 */
const extractAbstract = (pandocBlocks) => {
	const [first, second, ...rest] = pandocBlocks;
	if (!first || !second) {
		return null;
	}
	if (
		first.type === 'Header' &&
		first.level === 1 &&
		inlineText(first.content).toLowerCase().trim() === 'abstract' &&
		second.type === 'Para'
	) {
		return {
			abstract: { type: 'MetaBlocks', content: [second] },
			body: rest,
		};
	}
	return null;
};

export const extractMetaContent = (pandocAst) => {
	const { blocks, meta } = pandocAst;
	const extractedAbstract = extractAbstract(blocks);
	if (extractedAbstract) {
		const { abstract, body } = extractedAbstract;
		return {
			...pandocAst,
			meta: {
				...meta,
				abstract,
			},
			blocks: body,
		};
	}
	return pandocAst;
};
