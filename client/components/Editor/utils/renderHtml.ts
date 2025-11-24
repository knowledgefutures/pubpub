import React from 'react';

export const renderHtmlChildren = (isStaticallyRendered, html, wrapperElement = 'span') => {
	if (isStaticallyRendered) {
		return React.createElement(wrapperElement, {
			dangerouslySetInnerHTML: { __html: html },
		});
	}
	const outputElem = document.createElement(wrapperElement);
	outputElem.innerHTML = html;
	return outputElem;
};
