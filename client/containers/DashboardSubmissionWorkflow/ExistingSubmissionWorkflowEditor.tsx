import React, { useState } from 'react';
import { Button } from '@blueprintjs/core';

import { SubmissionWorkflow } from 'types';
import { usePageContext } from 'utils/hooks';
import { usePersistableState } from 'client/utils/usePersistableState';

import { updateSubmissionWorkflow } from './api';
import SubmissionWorkflowEditor from './SubmissionWorkflowEditor';
import DashboardSubmissionWorkflowFrame from './DashboardSubmissionWorkflowFrame';

type Props = {
	initialWorkflow: SubmissionWorkflow;
	onWorkflowUpdated: (w: SubmissionWorkflow) => unknown;
};

const ExistingSubmissionWorkflowEditor = (props: Props) => {
	const { onWorkflowUpdated, initialWorkflow } = props;
	const [isValid, setIsValid] = useState(false);

	const {
		scopeData: {
			elements: { activeCollection },
		},
	} = usePageContext();

	const {
		state: workflow,
		update: updateWorkflow,
		persist,
		hasChanges,
		isPersisting,
	} = usePersistableState(initialWorkflow, async (update, full) => {
		await updateSubmissionWorkflow(update, activeCollection.id);
		// The setTimeout() gives the usePersistableState hook a chance to disable its
		// onBeforeUnload hook (which triggers a browser popup asking the user if they really want
		// to navigate away) -- this is helpful because the parent DashboardSubmissionWorkflow
		// will tend to navigate away when this update is done.
		setTimeout(() => onWorkflowUpdated(full), 0);
	});

	const saveChangesButton = (
		<Button
			disabled={!isValid || !hasChanges}
			onClick={persist}
			loading={isPersisting}
			intent="primary"
		>
			Save Changes
		</Button>
	);

	return (
		<DashboardSubmissionWorkflowFrame controls={saveChangesButton}>
			<SubmissionWorkflowEditor
				workflow={workflow}
				onUpdateWorkflow={updateWorkflow}
				onValidateWorkflow={setIsValid}
				collection={activeCollection}
				finalStepButton={saveChangesButton}
			/>
		</DashboardSubmissionWorkflowFrame>
	);
};

export default ExistingSubmissionWorkflowEditor;
