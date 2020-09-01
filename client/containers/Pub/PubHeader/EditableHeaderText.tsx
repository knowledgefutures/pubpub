import React, { useState, useEffect } from 'react';
import { EditableText } from '@blueprintjs/core';

import { LengthIndicator } from 'components';

export type EditableHeaderTextProps = {
	canEdit: boolean;
	className?: string;
	placeholder: string;
	tagName?: string;
	text?: string;
	updateText: (...args: any[]) => any;
	maxLength?: number;
};

const EditableHeaderText = (props: EditableHeaderTextProps) => {
	const {
		canEdit,
		className = '',
		placeholder,
		tagName = 'h1',
		text = null,
		updateText,
		maxLength = Infinity,
	} = props;
	const [hasMounted, setHasMounted] = useState(false);
	const [intermediateValue, setIntermediateValue] = useState(text || '');
	const useEditableTitle = hasMounted && canEdit;

	useEffect(() => setHasMounted(true), []);
	useEffect(() => setIntermediateValue(text || ''), [text]);

	return React.createElement(
		tagName,
		{ className: className },
		useEditableTitle ? (
			<>
				<EditableText
					placeholder={placeholder}
					onConfirm={(newText) => updateText(newText.replace(/\n/g, ''))}
					onChange={setIntermediateValue}
					value={intermediateValue}
					multiline={true}
					confirmOnEnterKey={true}
					maxLength={maxLength}
				/>
				<LengthIndicator maxLength={maxLength} length={(intermediateValue || '').length} />
			</>
		) : (
			<span className="text-wrapper">{text}</span>
		),
	);
};

export default EditableHeaderText;
