import { extractMetaContent } from './extractMetaContent';

export const runTransforms = (pandocAst) => {
	return extractMetaContent(pandocAst);
};
