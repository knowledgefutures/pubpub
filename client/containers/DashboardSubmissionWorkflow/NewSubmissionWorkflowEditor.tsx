import React, { useCallback, useState } from 'react';
import { Button } from '@blueprintjs/core';

import { SubmissionWorkflow } from 'types';
import { useLocalStorage } from 'client/utils/useLocalStorage';
import { getEmptyDoc } from 'client/components/Editor';
import { usePageContext } from 'utils/hooks';

import { EditableSubmissionWorkflow } from './types';
import { createSubmissionWorkflow } from './api';
import SubmissionWorkflowEditor from './SubmissionWorkflowEditor';
import StartWorkflowCallout from './StartWorkflowCallout';
import DashboardSubmissionWorkflowFrame from './DashboardSubmissionWorkflowFrame';

const createEmptyWorkflow = (): EditableSubmissionWorkflow => {
	return {
		title: '',
		introText: getEmptyDoc(),
		instructionsText: getEmptyDoc(),
		acceptedText: getEmptyDoc(),
		declinedText: getEmptyDoc(),
		receivedEmailText: getEmptyDoc(),
		targetEmailAddress: '',
		enabled: false,
		requireAbstract: false,
		requireDescription: false,
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
		path: [`collection-${activeCollection!.id}`],
		debounce: 100,
	});

	const [isCreating, setIsCreating] = useState(!!initialWorkflow);
	const [isValid, setIsValid] = useState(false);
	const [isPersisting, setIsPersisting] = useState(false);

	const handleCreateNewWorkflow = useCallback(() => {
		setIsPersisting(true);
		createSubmissionWorkflow(workflow, activeCollection!.id)
			.then(onWorkflowCreated)
			.finally(() => setIsPersisting(false));
	}, [workflow, activeCollection, onWorkflowCreated]);

	const renderInner = () => {
		if (isCreating) {
			return (
				<>
					<SubmissionWorkflowEditor
						workflow={workflow}
						onUpdateWorkflow={(update) =>
							setWorkflow((current) => ({ ...current, ...update }))
						}
						onValidateWorkflow={setIsValid}
						collection={activeCollection!}
						finalStepButton={
							<Button
								disabled={!isValid}
								onClick={handleCreateNewWorkflow}
								loading={isPersisting}
								icon="tick"
								intent="primary"
							>
								Finish creating workflow
							</Button>
						}
					/>
				</>
			);
		}
		return <StartWorkflowCallout onStartWorkflow={() => setIsCreating(true)} />;
	};

	return (
		<DashboardSubmissionWorkflowFrame details="Follow these steps to let visitors submit to this Collection. You can close this tab and your work will be saved in this browser.">
			{renderInner()}
		</DashboardSubmissionWorkflowFrame>
	);
};

export default NewSubmissionWorkflowEditor;
