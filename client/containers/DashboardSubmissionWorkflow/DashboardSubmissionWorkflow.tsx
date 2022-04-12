import React, { useCallback } from 'react';

import { SubmissionWorkflow } from 'types';
import { ClientOnly } from 'components';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';

import NewSubmissionWorkflowEditor from './NewSubmissionWorkflowEditor';
import ExistingSubmissionWorkflowEditor from './ExistingSubmissionWorkflowEditor';

type Props = {
	initialSubmissionWorkflow: null | SubmissionWorkflow;
};

const DashboardSubmissions = (props: Props) => {
	const { initialSubmissionWorkflow } = props;
	const {
		scopeData: {
			elements: { activeCollection },
		},
	} = usePageContext();

	const handleWorkflowCreatedOrUpdated = useCallback(() => {
		window.location.href = getDashUrl({
			collectionSlug: activeCollection!.slug,
			mode: 'submissions',
		});
	}, [activeCollection]);

	if (initialSubmissionWorkflow) {
		return (
			<ExistingSubmissionWorkflowEditor
				initialWorkflow={initialSubmissionWorkflow}
				onWorkflowUpdated={handleWorkflowCreatedOrUpdated}
			/>
		);
	}

	return (
		<ClientOnly>
			<NewSubmissionWorkflowEditor onWorkflowCreated={handleWorkflowCreatedOrUpdated} />
		</ClientOnly>
	);
};

export default DashboardSubmissions;
