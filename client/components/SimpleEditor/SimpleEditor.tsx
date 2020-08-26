import React, { useRef, useCallback } from 'react';
import { DOMSerializer } from 'prosemirror-model';
import { buildSchema, getDocForHtmlString, docIsEmpty } from 'components/Editor';

import { MinimalEditor } from 'components';

type OwnProps = {
	initialHtmlString: string;
	onChange: (...args: any[]) => any;
	placeholder?: string;
};

const defaultProps = {
	placeholder: undefined,
};

const editorSchema = buildSchema();

type Props = OwnProps & typeof defaultProps;

const SimpleEditor = (props: Props) => {
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
			// @ts-expect-error ts-migrate(2322) FIXME: Type '({ view }: any) => void' is not assignable t... Remove this comment to see the full error message
			onChange={handleChange}
			placeholder={placeholder}
			initialContent={initialDoc.current}
			useFormattingBar={true}
			isTranslucent={true}
			constrainHeight={true}
		/>
	);
};
SimpleEditor.defaultProps = defaultProps;
export default SimpleEditor;
