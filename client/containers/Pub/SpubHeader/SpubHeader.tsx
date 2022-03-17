import React, { useState } from 'react';
import { Tab, Tabs, TabId, Icon, IconName } from '@blueprintjs/core';

import { DocJson, DefinitelyHas, PubHistoryState, PubPageData, SubmissionStatus } from 'types';
import { assert } from 'utils/assert';
import { apiFetch } from 'client/utils/apiFetch';
import { getEmptyDoc } from 'components/Editor';

import InstructionsTab from './InstructionsTab';
import SubmissionTab from './SubmissionTab';
import ContributorsTab from './ContributorsTab';
import PreviewTab from './PreviewTab';

require('./spubHeader.scss');

type Props = {
	historyData: PubHistoryState;
	updateLocalData: (
		type: string,
		patch: Partial<PubPageData> | Partial<PubHistoryState>,
	) => unknown;
	pubData: DefinitelyHas<PubPageData, 'submission'>;
};

export const renderTabTitle = (icon: IconName, title: string) => (
	<>
		<Icon icon={icon} /> {title}
	</>
);

const SpubHeader = (props: Props) => {
	const [selectedTab, setSelectedTab] = useState<TabId>('instructions');
	const [abstract, setAbstract] = useState(
		() => props.pubData.submission.abstract || getEmptyDoc(),
	);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [status, setStatus] = useState(props.pubData.submission.status);

	const updateAbstract = (newAbstract: DocJson) => {
		return apiFetch
			.put('/api/submissions', {
				abstract: newAbstract,
				id: props.pubData.submission.id,
			})
			.then(() => setAbstract(newAbstract));
	};

	const updateAndSavePubData = (newPubData: Partial<PubPageData>) => {
		props.updateLocalData('pub', newPubData);
		return apiFetch
			.put('/api/pubs', {
				...newPubData,
				pubId: props.pubData.id,
				communityId: props.pubData.communityId,
			})
			.catch(() => props.updateLocalData('pub', props.pubData));
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const updateSubmissionStatus = (newSubmissionStatus: SubmissionStatus) => {
		return apiFetch
			.put('/api/submissions', {
				status: newSubmissionStatus,
				id: props.pubData.submission.id,
			})
			.then(() => setStatus(newSubmissionStatus));
	};

	assert(props.pubData.submission.submissionWorkflow !== undefined);
	const updateHistoryData = (newHistoryData: Partial<PubHistoryState>) => {
		return props.updateLocalData('history', newHistoryData);
	};

	const instructionTabTitle = renderTabTitle('align-left', 'Instructions');
	const submissionTabTitle = renderTabTitle('manually-entered-data', 'Submission');
	const previewTabTitle = renderTabTitle('eye-open', 'Preview');
	const contributorsTabTitle = renderTabTitle('people', 'Contributors');
	const maybeActiveClass = (tabId: string) => `${tabId === selectedTab ? 'active' : 'inactive'}`;

	return (
		<Tabs
			id="spubHeader"
			onChange={(t) => setSelectedTab(t)}
			selectedTabId={selectedTab}
			className="spub-header-component tabs bp3-large"
		>
			<Tab
				id="instructions"
				title={instructionTabTitle}
				className={`tab-panel ${maybeActiveClass('instructions')}`}
				panel={
					<InstructionsTab
						submissionWorkflow={props.pubData.submission.submissionWorkflow}
						onBeginSubmission={() => setSelectedTab('submission')}
					/>
				}
			/>
			<Tab
				id="submission"
				title={submissionTabTitle}
				className={`tab-panel submission ${maybeActiveClass('submission')}`}
				panel={
					<SubmissionTab
						abstract={abstract}
						onUpdatePub={updateAndSavePubData}
						onUpdateAbstract={updateAbstract}
						pub={props.pubData}
					/>
				}
			/>
			<Tab
				className={`tab-panel ${maybeActiveClass('contributors')}`}
				id="contributors"
				title={contributorsTabTitle}
				panel={
					<ContributorsTab pubData={props.pubData} onUpdatePub={updateAndSavePubData} />
				}
			/>
			<Tab
				id="preview"
				title={previewTabTitle}
				className={`tab-panel ${maybeActiveClass('preview')}`}
				panel={
					<PreviewTab
						updateHistoryData={updateHistoryData}
						historyData={props.historyData}
						pubData={props.pubData}
					/>
				}
			/>
		</Tabs>
	);
};

export default SpubHeader;
