import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { EditableText } from '@blueprintjs/core';

import { LengthIndicator } from 'components';

const propTypes = {
	canEdit: PropTypes.bool.isRequired,
	className: PropTypes.string,
	placeholder: PropTypes.string.isRequired,
	tagName: PropTypes.string,
	text: PropTypes.string,
	updateText: PropTypes.func.isRequired,
	maxLength: PropTypes.number,
};

const defaultProps = {
	className: '',
	tagName: 'h1',
	text: null,
	maxLength: Infinity,
};

const EditableHeaderText = (props) => {
	const { canEdit, className, placeholder, tagName, text, updateText, maxLength } = props;
	const [hasMounted, setHasMounted] = useState(false);
	const [intermediateValue, setIntermediateValue] = useState(text);
	const useEditableTitle = hasMounted && canEdit;

	useEffect(() => setHasMounted(true), []);
	useEffect(() => setIntermediateValue(text), [text]);

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

EditableHeaderText.propTypes = propTypes;
EditableHeaderText.defaultProps = defaultProps;
export default EditableHeaderText;
