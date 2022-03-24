import React from 'react';
import { Button, Icon } from '@blueprintjs/core';

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
		<h1>{props.submissionWorkflow.title}</h1>
		<Editor initialContent={props.submissionWorkflow.instructionsText} isReadOnly />
		<Button
			intent="primary"
			outlined
			className="begin-submission-button"
			text="Begin Submission"
			icon={<Icon className="begin-submission-icon" iconSize={21} icon="arrow-right" />}
			onClick={props.onBeginSubmission}
		/>
	</SpubHeaderTab>
);

export default InstructionsTab;
