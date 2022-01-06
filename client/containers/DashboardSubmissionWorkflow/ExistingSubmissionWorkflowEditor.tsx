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
		// Give the usePersistableState hook disable its onBeforeUnload before the parent redirects
		setTimeout(() => onWorkflowUpdated(full), 0);
	});

	return (
		<DashboardSubmissionWorkflowFrame
			controls={
				<Button
					disabled={!isValid || !hasChanges}
					onClick={persist}
					loading={isPersisting}
					intent="primary"
				>
					Save Changes
				</Button>
			}
		>
			<SubmissionWorkflowEditor
				workflow={workflow}
				onUpdateWorkflow={updateWorkflow}
				onValidateWorkflow={setIsValid}
				collection={activeCollection}
			/>
		</DashboardSubmissionWorkflowFrame>
	);
};

export default ExistingSubmissionWorkflowEditor;
