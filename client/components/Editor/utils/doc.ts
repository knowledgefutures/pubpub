import { DOMParser, Node, Schema } from 'prosemirror-model';

import { DocJson } from 'types';

import { editorSchema } from './schema';

export const getEmptyDoc = (): DocJson => {
	return { type: 'doc' as const, attrs: { meta: {} }, content: [{ type: 'paragraph' }] };
};

export const isEmptyDoc = (doc: DocJson) => {
	return doc.content.every((child) => child.content?.length === 0);
};

export const isEmptyDocNode = (doc: Node) => {
	if (doc.childCount === 0) {
		return true;
	}
	if (doc.childCount === 1) {
		const { isTextblock, content, attrs } = doc.firstChild!;
		return isTextblock && content.size === 0 && !attrs.textAlign;
	}
	return false;
};

export const getDocForHtmlString = (htmlString: string, schema: Schema) => {
	const wrapperElem = document.createElement('div');
	wrapperElem.innerHTML = htmlString;
	return DOMParser.fromSchema(schema).parse(wrapperElem);
};

export const jsonToNode = (doc: DocJson, schema: Schema = editorSchema) => {
	return Node.fromJSON(schema, doc);
};
