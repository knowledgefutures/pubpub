import React, { useEffect, useState } from 'react';
import { Tab, Tabs, TabId, Icon, IconName } from '@blueprintjs/core';

import { DocJson, DefinitelyHas, PubHistoryState, PubPageData } from 'types';
import { assert } from 'utils/assert';
import { apiFetch } from 'client/utils/apiFetch';
import { getEmptyDoc } from 'components/Editor';

import { usePubContext } from '../pubHooks';
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
	const { updatePubData } = usePubContext();

	const updateAbstract = async (newAbstract: DocJson) => {
		return apiFetch('/api/submissions', {
			method: 'PUT',
			body: JSON.stringify({
				abstract: newAbstract,
				id: props.pubData.submission.id,
			}),
		}).then(() => setAbstract(newAbstract));
	};

	const updateAndSavePubData = async (newPubData: Partial<PubPageData>) => {
		props.updateLocalData('pub', newPubData);
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				...newPubData,
				pubId: props.pubData.id,
				communityId: props.pubData.communityId,
			}),
		}).catch(() => props.updateLocalData('pub', props.pubData));
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

	useEffect(() => {
		updatePubData({ isReadOnly: selectedTab === 'preview' });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedTab]);

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
						pub={props.pubData}
						abstract={abstract}
						onUpdatePub={updateAndSavePubData}
						onUpdateAbstract={updateAbstract}
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
