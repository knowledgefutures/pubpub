import React, { useCallback, useState } from 'react';
import { Button } from '@blueprintjs/core';

import { SubmissionWorkflow } from 'types';
import { useLocalStorage } from 'client/utils/useLocalStorage';
import { getEmptyDoc } from 'client/components/Editor';
import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';

import { EditableSubmissionWorkflow } from './types';
import SubmissionWorkflowEditor from './SubmissionWorkflowEditor';
import StartWorkflowCallout from './StartWorkflowCallout';

const createEmptyWorkflow = (): EditableSubmissionWorkflow => {
	return {
		title: '',
		introText: getEmptyDoc(),
		instructionsText: getEmptyDoc(),
		emailText: getEmptyDoc(),
		targetEmailAddress: '',
		enabled: false,
	};
};

type Props = {
	onWorkflowCreated: (w: SubmissionWorkflow) => unknown;
};

const NewSubmissionWorkflowEditor = (props: Props) => {
	const { onWorkflowCreated } = props;
	const {
		communityData,
		scopeData: {
			elements: { activeCollection },
		},
	} = usePageContext();

	const {
		value: workflow,
		setValue: setWorkflow,
		initialValue: initialWorkflow,
	} = useLocalStorage<EditableSubmissionWorkflow>({
		initial: createEmptyWorkflow,
		communityId: communityData.id,
		featureName: 'new-submission-workflow-editor',
		path: [`collection-${activeCollection.id}`],
		debounce: 100,
	});

	const [isCreating, setIsCreating] = useState(!!initialWorkflow);
	const [isPersisting, setIsPersisting] = useState(false);

	const handleWorkflowCreated = useCallback(() => {
		const { introText, instructionsText, emailText, title, targetEmailAddress } = workflow;
		setIsPersisting(true);
		apiFetch
			.post('/api/submissionWorkflows', {
				collectionId: activeCollection.id,
				introText,
				instructionsText,
				emailText,
				title,
				targetEmailAddress,
				enabled: true,
			})
			.then(onWorkflowCreated)
			.finally(() => setIsPersisting(false));
	}, [workflow, activeCollection, onWorkflowCreated]);

	if (isCreating) {
		return (
			<>
				<SubmissionWorkflowEditor
					workflow={workflow}
					onUpdateWorkflow={(w) => setWorkflow(w)}
					collection={activeCollection}
					renderCompletionButton={(isValid) => (
						<Button
							disabled={!isValid}
							onClick={handleWorkflowCreated}
							icon="tick"
							loading={isPersisting}
						>
							Save and continue
						</Button>
					)}
				/>
			</>
		);
	}

	return <StartWorkflowCallout onStartWorkflow={() => setIsCreating(true)} />;
};

export default NewSubmissionWorkflowEditor;
