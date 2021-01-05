import React, { useRef, useCallback } from 'react';
import { DOMSerializer, Node } from 'prosemirror-model';
import { buildSchema, getDocForHtmlString, docIsEmpty } from 'components/Editor';

import { MinimalEditor } from 'components';

type Props = {
	initialHtmlString: string;
	onChange: (htmlContents: string) => unknown;
	placeholder?: string;
};

const editorSchema = buildSchema();

const SimpleEditor = (props: Props) => {
	const { onChange, placeholder, initialHtmlString } = props;
	const initialDoc = useRef<{ [key: string]: any }>();

	if (!initialDoc.current) {
		initialDoc.current = getDocForHtmlString(initialHtmlString, editorSchema).toJSON();
	}

	const handleEdit = useCallback(
		(doc: Node) => {
			const { schema } = doc.type;
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
			onEdit={handleEdit}
			placeholder={placeholder}
			initialContent={initialDoc.current}
			useFormattingBar={true}
			isTranslucent={true}
			constrainHeight={true}
		/>
	);
};

export default SimpleEditor;
