import React, { useState } from 'react';
import { Button } from '@blueprintjs/core';

import { useLocalStorage } from 'client/utils/useLocalStorage';
import { getEmptyDoc } from 'client/components/Editor';
import { usePageContext } from 'utils/hooks';

import { EditableSubmissionWorkflow } from './types';
import SubmissionWorkflowEditor from './SubmissionWorkflowEditor';
import StartWorkflowCallout from './StartWorkflowCallout';

const createEmptyWorkflow = (): EditableSubmissionWorkflow => {
	return {
		instructionsText: getEmptyDoc(),
		emailText: getEmptyDoc(),
		targetEmailAddress: '',
		enabled: false,
		bannerContent: {
			title: '',
			body: getEmptyDoc(),
		},
	};
};

type Props = {
	onWorkflowCreated: (w: EditableSubmissionWorkflow) => unknown;
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
							onClick={() => onWorkflowCreated(workflow)}
							icon="tick"
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
