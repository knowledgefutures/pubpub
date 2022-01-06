import React from 'react';
import { Button } from '@blueprintjs/core';

import { MenuButton, MenuItem } from 'components/Menu';
import { SubmissionWorkflow } from 'types';

import { updateSubmissionWorkflow } from '../DashboardSubmissionWorkflow/api';

type Props = {
	workflow: SubmissionWorkflow;
	onUpdateWorkflow: (patch: Partial<SubmissionWorkflow>) => unknown;
};

const AcceptSubmissionsToggle = (props: Props) => {
	const { workflow, onUpdateWorkflow } = props;
	const { enabled, collectionId } = workflow;

	const handleSetEnabled = async (nextEnabled: boolean) => {
		const patch = { enabled: nextEnabled };
		await updateSubmissionWorkflow(patch, collectionId);
		onUpdateWorkflow(patch);
	};

	return (
		<>
			{!enabled && (
				<Button intent="primary" icon="globe" onClick={() => handleSetEnabled(true)}>
					Enable submissions
				</Button>
			)}
			{enabled && (
				<MenuButton
					aria-label="Accepting submissions"
					buttonContent="Enabled"
					buttonProps={{
						icon: 'tick',
						rightIcon: 'caret-down',
						outlined: true,
					}}
				>
					<MenuItem
						text="Stop accepting submissions"
						onClick={() => handleSetEnabled(false)}
					/>
				</MenuButton>
			)}
		</>
	);
};
export default AcceptSubmissionsToggle;
