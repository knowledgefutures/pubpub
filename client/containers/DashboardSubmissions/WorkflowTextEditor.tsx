import React from 'react';

import { MinimalEditor } from 'components';
import { DocJson } from 'types';

require('./workflowTextEditor.scss');

type Props = {
	initialContent: DocJson;
	onContent: (content: DocJson) => unknown;
	placeholder: string;
};

const WorkflowTextEditor = (props: Props) => {
	const { initialContent, onContent, placeholder } = props;
	return (
		<div className="workflow-text-editor-component">
			<MinimalEditor
				initialContent={initialContent}
				onEdit={(doc) => onContent(doc.toJSON() as DocJson)}
				getButtons={(buttons) => buttons.workflowButtonSet}
				placeholder={placeholder}
				useFormattingBar
				constrainHeight
			/>
		</div>
	);
};

export default WorkflowTextEditor;
