import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { DOMSerializer } from 'prosemirror-model';

import { MinimalEditor } from 'components';
import { buildSchema, getDocForHtmlString } from '@pubpub/editor';

const propTypes = {
	initialHtmlString: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired, // Return HTML string of content
	onBlur: PropTypes.func,
	placeholder: PropTypes.string,
};

const defaultProps = {
	placeholder: undefined,
	onBlur: () => {},
};

const schema = buildSchema();

const SimpleEditor = (props) => {
	const { onChange, onBlur, placeholder, initialHtmlString } = props;
	const initialDoc = useRef(null);

	if (!initialDoc.current) {
		initialDoc.current = getDocForHtmlString(initialHtmlString, schema).toJSON();
	}

	const handleChange = ({ view }) => {
		const htmlForNodes = [];
		const serializer = DOMSerializer.fromSchema(view.state.schema);
		view.state.doc.forEach((node) => {
			htmlForNodes.push(serializer.serializeNode(node).outerHTML);
		});
		const htmlString = htmlForNodes.join('');
		onChange(htmlString);
	};

	return (
		<MinimalEditor
			onChange={handleChange}
			onBlur={onBlur}
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
