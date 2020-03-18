import { extractEndnotesTransformer } from './extractEndnotes';

const getTransformersForFlags = ({ extractEndnotes }) => {
	return [extractEndnotes && extractEndnotesTransformer].filter((x) => x);
};

export const runExperimentalTransforms = (pandocAst, transformFlags) => {
	return getTransformersForFlags(transformFlags).reduce((ast, fn) => fn(ast), pandocAst);
};
