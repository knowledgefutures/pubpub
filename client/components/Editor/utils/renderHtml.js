import React from 'react';

export const renderHtmlChildren = (isReact, html, wrapperElement = 'span') => {
	if (isReact) {
		/* eslint-disable-next-line react/no-danger */
		return React.createElement(wrapperElement, {
			dangerouslySetInnerHTML: { __html: html },
		});
	}
	const outputElem = document.createElement(wrapperElement);
	outputElem.innerHTML = html;
	return outputElem;
};
