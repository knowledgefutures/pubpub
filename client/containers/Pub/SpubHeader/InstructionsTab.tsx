import React from 'react';

import { SubmissionWorkflow } from 'types';
import { Editor } from 'components';

import SpubHeaderTab from './SpubHeaderTab';

require('./instructionsTab.scss');

type Props = {
	submissionWorkflow: SubmissionWorkflow;
};

const InstructionsTab = (props: Props) => (
	<SpubHeaderTab expandToFold className="instructions-tab-component">
		<h1 className="submission-workflow-title">{props.submissionWorkflow.title}</h1>
		<Editor initialContent={props.submissionWorkflow.instructionsText} isReadOnly />
	</SpubHeaderTab>
);

export default InstructionsTab;
