import React from 'react';

import { SubmissionWorkflow } from 'types';
import { Editor } from 'components';

type Props = {
	submissionWorkflow: SubmissionWorkflow;
};

const InstructionsTab = (props: Props) => (
	<>
		<h1 className="submission-workflow-title">{props.submissionWorkflow.title}</h1>
		<Editor initialContent={props.submissionWorkflow.instructionsText} isReadOnly />
	</>
);

export default InstructionsTab;
