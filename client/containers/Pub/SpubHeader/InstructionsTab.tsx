import React from 'react';
import { Button } from '@blueprintjs/core';

import { SubmissionWorkflow } from 'types';
import { Editor } from 'components';

import SpubHeaderTab from './SpubHeaderTab';

require('./instructionsTab.scss');

type Props = {
	onBeginSubmission: () => void;
	submissionWorkflow: SubmissionWorkflow;
};

const InstructionsTab = (props: Props) => (
	<SpubHeaderTab expandToFold className="instructions-tab-component">
		<h1 className="submission-workflow-title">{props.submissionWorkflow.title}</h1>
		<Editor initialContent={props.submissionWorkflow.instructionsText} isReadOnly />
		<Button
			large
			text="Begin Submission"
			icon="arrow-right"
			onClick={props.onBeginSubmission}
		/>
	</SpubHeaderTab>
);

export default InstructionsTab;
