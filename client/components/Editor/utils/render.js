import React from 'react';
import css from 'css';
import camelCaseCss from 'camelcase-css';

const parseStyleToObject = (style) => {
	try {
		const styleObj = {};
		const wrappedStyle = `.whatever { ${style} } `;
		const cssAst = css.parse(wrappedStyle);
		const { declarations } = cssAst.stylesheet.rules[0];
		declarations.forEach(({ property, value }) => {
			const camelCaseProperty = camelCaseCss(property);
			styleObj[camelCaseProperty] = value;
		});
		return styleObj;
	} catch (_) {
		return {};
	}
};

/* This function implements a server-friendly (via React)
   DOM renderer based on ProseMirror's DOMOutputSpec structure:
   https://prosemirror.net/docs/ref/#model.DOMOutputSpec
   Having this function allows us to specify a single toDOM()
   function in each schema, and render that with React on the
   server and ProseMirror on the client. */
const renderReactFromSpec = (elem, key, holeContent) => {
	if (!elem) {
		return null;
	}
	if (typeof elem === 'string') {
		return holeContent || elem;
	}
	if (elem.nodeType || elem.$$typeof) {
		return elem;
	}

	let attrs;
	let children;
	const hasAttrs =
		elem[1] && typeof elem[1] === 'object' && !elem[1].nodeType && !Array.isArray(elem[1]);
	if (hasAttrs) {
		attrs = elem[1];
	} else {
		attrs = {};
	}

	const start = hasAttrs ? 2 : 1;
	if (elem[0] === 'br') {
		children = undefined;
	} else if (holeContent && !Array.isArray(elem[start])) {
		children = holeContent;
	} else if (typeof elem[start] === 'string') {
		children = elem[start];
	} else {
		const childArray = elem.slice(start, elem.length);
		if (childArray.length) {
			children = childArray.map((child, index) => {
				const childKey = `${key}-${index}`;
				return renderReactFromSpec(child, childKey, holeContent);
			});
		}
	}

	if ('class' in attrs) {
		attrs.className = attrs.class;
		delete attrs.class;
	}

	if ('colspan' in attrs) {
		attrs.colSpan = attrs.colspan;
		delete attrs.colspan;
	}

	if ('rowspan' in attrs) {
		attrs.rowSpan = attrs.rowspan;
		delete attrs.rowspan;
	}

	if ('style' in attrs && typeof attrs.style === 'string') {
		attrs.style = parseStyleToObject(attrs.style);
	}

	return React.createElement(elem[0], { ...attrs, key: key }, children);
};

export const renderStatic = (schema, nodeArray) => {
	return nodeArray.map((node, index) => {
		let children;
		if (node.content) {
			children = renderStatic(schema, node.content);
		}
		if (node.type === 'text') {
			const marks = node.marks || [];
			children = marks.reduce((prev, curr, markIndex) => {
				const currIndex = `${index}-${markIndex}`;
				const MarkComponent = schema.marks[curr.type].spec;
				return renderReactFromSpec(MarkComponent.toDOM(curr), currIndex, prev);
			}, node.text);
		}

		const NodeComponent = schema.nodes[node.type].spec;
		const output = renderReactFromSpec(
			NodeComponent.toDOM({
				...node,
				attrs: { ...node.attrs, key: index },
				type: schema.nodes[node.type],
			}),
			index,
			children,
		);
		return output;
	});
};

export const renderHtmlChildren = (node, html, wrapperElement = 'span') => {
	const hasKey = node.attrs.key !== undefined;
	if (hasKey) {
		/* eslint-disable-next-line react/no-danger */
		return React.createElement(wrapperElement, {
			key: node.attrs.key,
			dangerouslySetInnerHTML: { __html: html },
		});
	}

	const outputElem = document.createElement(wrapperElement);
	outputElem.innerHTML = html;
	return outputElem;
};
