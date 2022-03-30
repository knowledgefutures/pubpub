import React from 'react';
import classNames from 'classnames';
import { Label } from '@blueprintjs/core';

require('./spubHeaderField.scss');

type Props = {
	asLabel?: boolean;
	children?: React.ReactNode;
	title: React.ReactNode;
	instructions?: React.ReactNode;
	fullWidth?: boolean;
	hasMargin?: boolean;
};

const SpubHeaderField = (props: Props) => {
	const {
		asLabel = false,
		children,
		fullWidth = false,
		hasMargin = true,
		instructions,
		title,
	} = props;

	const content = (
		<>
			<h2 className="title">{title}</h2>
			{instructions && <p className="instructions">{instructions}</p>}
			{children}
		</>
	);

	return React.createElement(
		asLabel ? Label : 'div',
		{
			className: classNames(
				'spub-header-field-component',
				fullWidth && 'full-width',
				hasMargin && 'has-margin',
			),
		},
		content,
	);
};

export default SpubHeaderField;
