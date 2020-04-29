import { DOMParser, Node } from 'prosemirror-model';

export const getEmptyDoc = () => {
	return { type: 'doc', attrs: { meta: {} }, content: [{ type: 'paragraph' }] };
};

export const docIsEmpty = (doc) => {
	return (
		doc.childCount === 0 ||
		(doc.childCount === 1 && doc.firstChild.isTextblock && doc.firstChild.content.size === 0)
	);
};

export const getDocForHtmlString = (htmlString, schema) => {
	const wrapperElem = document.createElement('div');
	wrapperElem.innerHTML = htmlString;
	return DOMParser.fromSchema(schema).parse(wrapperElem);
};

export const jsonToNode = (doc, schema) => {
	return Node.fromJSON(schema, doc);
};
