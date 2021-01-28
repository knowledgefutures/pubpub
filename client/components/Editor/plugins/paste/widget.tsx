import React from 'react';
import ReactDOM from 'react-dom';
import { Spinner } from '@blueprintjs/core';

export const createPlaceholderWidgetElement = (progress: number) => {
	const element = document.createElement('div');
	element.classList.add('paste-placeholder-decoration');
	ReactDOM.render(
		<>
			<Spinner value={progress === 1 ? undefined : progress} />
		</>,
		element,
	);
	return element;
};
