import React from 'react';
import { AnchorButton } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';

const SubmissionWorkFlowButton = () => {
	const {
		scopeData: {
			activePermissions: { canManage },
			elements: { activeCollection },
		},
	} = usePageContext();

	if (!canManage) {
		return null;
	}

	return (
		<AnchorButton
			outlined
			icon="form"
			href={getDashUrl({
				collectionSlug: activeCollection.slug,
				mode: 'submissions',
				subMode: 'workflow',
			})}
		>
			Edit Workflow
		</AnchorButton>
	);
};

export default SubmissionWorkFlowButton;
