import React, { useState, useCallback } from 'react';
import classNames from 'classnames';
import { Tooltip } from '@blueprintjs/core';

import { Icon } from 'components';

require('./spubHeaderField.scss');

type Props = {
	asLabel?: boolean;
	children?: React.ReactNode;
	title: React.ReactNode;
	instructions?: React.ReactNode;
	fullWidth?: boolean;
} & ({ valid: boolean; invalidNotice: React.ReactNode } | {});

const renderValidationState = (props: Props) => {
	if ('valid' in props) {
		const { valid, invalidNotice } = props;
		if (!valid) {
			return (
				<Tooltip content={<span>{invalidNotice}</span>}>
					<Icon
						intent="warning"
						icon="warning-sign"
						className="invalid-icon"
						iconSize={13}
					/>
				</Tooltip>
			);
		}
	}
	return null;
};

const SpubHeaderField = (props: Props) => {
	const { asLabel = false, children, fullWidth = false, instructions, title } = props;
	const [hasBlurred, setHasBlurred] = useState(false);
	const handleBlur = useCallback(() => setHasBlurred(true), []);

	const content = (
		<>
			<h2 className="title">
				{title}
				{hasBlurred && renderValidationState(props)}
			</h2>
			{instructions && <p className="instructions">{instructions}</p>}
			{children}
		</>
	);

	return React.createElement(
		asLabel ? 'label' : 'div',
		{
			className: classNames('spub-header-field-component', fullWidth && 'full-width'),
			onBlur: handleBlur,
		},
		content,
	);
};

export default SpubHeaderField;
