const extractAbstract = (pandocBlocks) => {
	const [first, second, ...rest] = pandocBlocks;
	if (first.type === 'Header' && first.level === 1 && first.content.length === 1) {
		const [firstContent] = first.content;
		if (firstContent.type === 'Str' && firstContent.content.toLowerCase() === 'abstract') {
			if (second.type === 'Para') {
				return {
					abstract: { type: 'MetaInlines', content: second.content },
					body: rest,
				};
			}
		}
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
