import React, { useMemo, useRef } from 'react';

import { DocJson, Pub, PubPageData } from 'types';
import { apiFetch } from 'client/utils/apiFetch';
import { useSticky } from 'client/utils/useSticky';
import { PendingChangesProvider } from 'components';
import { usePendingChanges } from 'utils/hooks';

import { usePubContext } from '../pubHooks';
import PubHeader from '../PubHeader';
import PubHeaderSticky from '../PubHeader/PubHeaderSticky';
import InstructionsTab from './InstructionsTab';
import DetailsTab from './DetailsTab';
import ContributorsTab from './ContributorsTab';
import SpubHeaderToolBar from './SpubHeaderToolBar';
import { getPubHeadings } from '../PubHeader/headerUtils';

require('./spubHeader.scss');

export type SpubHeaderTab = 'instructions' | 'details' | 'contributors' | 'preview';

const SpubHeader = () => {
	const { pendingPromise } = usePendingChanges();
	const {
		updatePubData,
		pubData,
		collabData: { editorChangeObject },
		updateSubmissionState,
		submissionState,
	} = usePubContext();
	const { selectedTab, submission } = submissionState!;
	const headerRef = useRef<HTMLDivElement>(null);

	// TODO(ian): Move this computation to usePubBodyState()
	const pubHeadings = useMemo(
		() => getPubHeadings(pubData.initialDoc, editorChangeObject),
		[pubData.initialDoc, editorChangeObject],
	);

	useSticky({
		isActive: !!headerRef.current,
		target: '.spub-header-component',
		offset: headerRef?.current?.offsetHeight ? 37 - headerRef.current.offsetHeight : 0,
	});

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

	const updateAndSavePubData = async (newPubData: Partial<Pub>) => {
		const { title, description } = newPubData;
		updatePubData(newPubData as Partial<PubPageData>);
		if (title || description) {
			await pendingPromise(
				apiFetch
					.put('/api/pubs', {
						pubId: pubData.id,
						title,
						description,
					})
					.catch(() => updatePubData(pubData)),
			);
		}
	};

	const setSelectedTab = (nextTab: SpubHeaderTab) => {
		updateSubmissionState({ selectedTab: nextTab });
	};

	return (
		<div className="spub-header-component" ref={headerRef}>
			<div className="content-container">
				<SpubHeaderToolBar
					onSelectTab={(t: SpubHeaderTab) => setSelectedTab(t)}
					selectedTab={selectedTab}
					submission={submission}
				/>
				{selectedTab === 'instructions' && (
					<InstructionsTab
						onBeginSubmission={() => setSelectedTab('details')}
						submissionWorkflow={submission.submissionWorkflow!}
					/>
				)}
				{selectedTab === 'details' && (
					<DetailsTab
						abstract={submission.abstract}
						onUpdatePub={updateAndSavePubData}
						onUpdateAbstract={updateAbstract}
						pub={pubData}
					/>
				)}
				{selectedTab === 'contributors' && (
					<ContributorsTab pubData={pubData} onUpdatePub={updateAndSavePubData} />
				)}
				{selectedTab === 'preview' && <PubHeader sticky={false} />}
			</div>
			<PubHeaderSticky pubData={pubData} pubHeadings={pubHeadings} />
		</div>
	);
};

export default () => (
	<PendingChangesProvider>
		<SpubHeader />
	</PendingChangesProvider>
);
