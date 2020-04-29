import React, { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { DOMSerializer } from 'prosemirror-model';
import { buildSchema, getDocForHtmlString, docIsEmpty } from 'components/Editor';

import { MinimalEditor } from 'components';

const propTypes = {
	initialHtmlString: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired, // Return HTML string of content
	placeholder: PropTypes.string,
};

const defaultProps = {
	placeholder: undefined,
};

const editorSchema = buildSchema();

const SimpleEditor = (props) => {
	const { onChange, placeholder, initialHtmlString } = props;
	const initialDoc = useRef(null);

	if (!initialDoc.current) {
		initialDoc.current = getDocForHtmlString(initialHtmlString, editorSchema).toJSON();
	}

	const handleChange = useCallback(
		({ view }) => {
			const { doc, schema } = view.state;
			if (docIsEmpty(doc)) {
				onChange('');
				return;
			}
			const serializer = DOMSerializer.fromSchema(schema);
			const domFragment = serializer.serializeFragment(doc.content);
			const wrapper = document.createElement('div');
			wrapper.appendChild(domFragment);
			onChange(wrapper.innerHTML);
		},
		[onChange],
	);

	return (
		<MinimalEditor
			onChange={handleChange}
			placeholder={placeholder}
			initialContent={initialDoc.current}
			useFormattingBar={true}
			isTranslucent={true}
			constrainHeight={true}
		/>
	);
};

SimpleEditor.propTypes = propTypes;
SimpleEditor.defaultProps = defaultProps;
export default SimpleEditor;
