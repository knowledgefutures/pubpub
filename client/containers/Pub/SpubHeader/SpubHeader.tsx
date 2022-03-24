import React from 'react';
import { Tab, Tabs } from '@blueprintjs/core';

import { DocJson, PubPageData } from 'types';
import { apiFetch } from 'client/utils/apiFetch';
import { PendingChangesProvider } from 'components';
import { usePendingChanges } from 'utils/hooks';

import { usePubContext } from '../pubHooks';
import InstructionsTab from './InstructionsTab';
import SubmissionTab from './SubmissionTab';
import ContributorsTab from './ContributorsTab';
import SpubHeaderToolBar from './SpubHeaderToolBar';

require('./spubHeader.scss');

export type SpubHeaderTab = 'instructions' | 'submission' | 'preview';

const SpubHeader = () => {
	const { pendingPromise } = usePendingChanges();
	const { updatePubData, pubData, updateSubmissionState, submissionState } = usePubContext();
	const { selectedTab, submission } = submissionState!;

	const updateAbstract = async (newAbstract: DocJson) => {
		updateSubmissionState(({ submission: currentSubmission }) => ({
			submission: {
				...currentSubmission,
				abstract: newAbstract,
			},
		}));
		return pendingPromise(
			apiFetch.put('/api/submissions', {
				abstract: newAbstract,
				id: submission.id,
			}),
		);
	};

	const updateAndSavePubData = async (newPubData: Partial<PubPageData>) => {
		updatePubData(newPubData);
		return pendingPromise(
			apiFetch('/api/pubs', {
				method: 'PUT',
				body: JSON.stringify({
					...newPubData,
					pubId: pubData.id,
					communityId: pubData.communityId,
				}),
			}).catch(() => updatePubData(pubData)),
		);
	};

	const setSelectedTab = (nextTab: SpubHeaderTab) => {
		updateSubmissionState({ selectedTab: nextTab });
	};

	return (
		<div className="spub-header-component">
			<SpubHeaderToolBar
				onSelectTab={(t: SpubHeaderTab) => setSelectedTab(t)}
				selectedTab={selectedTab}
				submission={submission}
			/>
			<Tabs id="spubHeaderPanels" selectedTabId={selectedTab}>
				<Tab
					id="instructions"
					panel={
						<InstructionsTab
							onBeginSubmission={() => setSelectedTab('submission')}
							submissionWorkflow={submission.submissionWorkflow!}
						/>
					}
				/>
				<Tab
					id="submission"
					panel={
						<SubmissionTab
							abstract={submission.abstract}
							onUpdatePub={updateAndSavePubData}
							onUpdateAbstract={updateAbstract}
							pub={pubData}
						/>
					}
				/>
				<Tab
					id="contributors"
					panel={<ContributorsTab pubData={pubData} onUpdatePub={updateAndSavePubData} />}
				/>
				<Tab id="preview" />
			</Tabs>
		</div>
	);
};

export default () => (
	<PendingChangesProvider>
		<SpubHeader />
	</PendingChangesProvider>
);
