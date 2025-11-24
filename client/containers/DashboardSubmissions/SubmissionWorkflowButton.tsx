import React from 'react';

import { AnchorButton } from '@blueprintjs/core';

import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';

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
				collectionSlug: activeCollection!.slug,
				mode: 'submissions',
				subMode: 'workflow',
			})}
		>
			Edit Workflow
		</AnchorButton>
	);
};

export default SubmissionWorkFlowButton;
