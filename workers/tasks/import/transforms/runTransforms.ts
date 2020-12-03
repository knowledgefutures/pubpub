import { extractEndnotesTransformer } from './extractEndnotes';
import { inlineMetaContent } from './inlineMetaContent';

const getTransformersForFlags = ({ extractEndnotes }) => {
	return [inlineMetaContent, extractEndnotes && extractEndnotesTransformer].filter((x) => x);
};

export const runTransforms = (pandocAst, transformFlags) => {
	return getTransformersForFlags(transformFlags).reduce((ast, fn) => fn(ast), pandocAst);
};
