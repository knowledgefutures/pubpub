import React from 'react';
import { Button } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';

const SubmissionWorkFlowButton = () => {
	const { scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;

	if (!canManage) {
		return null;
	}
	return (
		<>
			<Button outlined icon="form">
				Edit Submission Workflow
			</Button>
		</>
	);
};
export default SubmissionWorkFlowButton;
