import React, { useCallback, useRef } from 'react';
import { Node } from 'prosemirror-model';
import { renderToString } from 'react-dom/server';

import { MinimalEditor } from 'components';
import { usePubContext } from 'containers/Pub/pubHooks';
import { editorSchema, getDocForHtmlString, isEmptyDocNode, renderStatic } from 'components/Editor';
import { useFacetsQuery } from 'client/utils/useFacets';

type Props = {
	initialHtmlString: string;
	onChange: (htmlContents: string) => unknown;
	placeholder?: string;
};

const SimpleEditor = (props: Props) => {
	const { noteManager } = usePubContext();
	const { onChange, placeholder, initialHtmlString } = props;
	const initialDoc = useRef<{ [key: string]: any }>();
	const nodeLabels = useFacetsQuery((F) => F.NodeLabels);

	if (!initialDoc.current) {
		initialDoc.current = getDocForHtmlString(initialHtmlString, editorSchema).toJSON();
	}

	const handleEdit = useCallback(
		(doc: Node) => {
			const { schema } = doc.type;
			if (isEmptyDocNode(doc)) {
				onChange('');
				return;
			}
			const html = renderToString(
				React.createElement(
					React.Fragment,
					{},
					...renderStatic({ schema, doc: doc.toJSON(), nodeLabels, noteManager }),
				),
			);

			onChange(html);
		},
		[onChange, nodeLabels, noteManager],
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
