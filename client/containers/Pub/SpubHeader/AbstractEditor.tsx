import React, { useMemo } from 'react';

import { Callback, DocJson } from 'types';
import { MinimalEditor } from 'components';
import { getAbstractDocFromPubDoc } from 'utils/pub/abstract';

import { usePubContext } from '../pubHooks';

type Props = {
	isReadOnly: boolean;
	submissionAbstract: null | DocJson;
	onUpdateAbstract: Callback<DocJson>;
};

const AbstractEditor = (props: Props) => {
	const { isReadOnly, submissionAbstract, onUpdateAbstract } = props;
	const {
		collabData: { editorChangeObject },
		pubData: { initialDoc },
	} = usePubContext();

	const { readOnlyAbstractDoc, readOnlyEditorKey } = useMemo(() => {
		if (isReadOnly) {
			const editorDoc = editorChangeObject?.view?.state.doc.toJSON() as DocJson;
			return {
				readOnlyAbstractDoc: getAbstractDocFromPubDoc(editorDoc || initialDoc),
				readOnlyEditorKey: Date.now(),
			};
		}
		return { readOnlyAbstractDoc: null, readOnlyEditorKey: Date.now() };
	}, [isReadOnly, editorChangeObject, initialDoc]);

	const sharedProps = {
		customNodes: { doc: { content: 'paragraph' } },
		constrainHeight: true,
		noMinHeight: true,
	};

	if (isReadOnly) {
		return (
			<MinimalEditor
				{...sharedProps}
				key={readOnlyEditorKey}
				initialContent={readOnlyAbstractDoc}
				isReadOnly
			/>
		);
	}

	return (
		<MinimalEditor
			{...sharedProps}
			initialContent={submissionAbstract}
			onEdit={(doc) => onUpdateAbstract(doc.toJSON() as DocJson)}
			debounceEditsMs={300}
			useFormattingBar
		/>
	);
};

export default AbstractEditor;
