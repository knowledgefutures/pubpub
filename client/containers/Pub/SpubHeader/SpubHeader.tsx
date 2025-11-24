import type { DocJson, Pub, PubPageData } from 'types';

import React, { useMemo, useRef, useState } from 'react';

import { apiFetch } from 'client/utils/apiFetch';
import { useSticky } from 'client/utils/useSticky';
import { PendingChangesProvider } from 'components';
import { usePendingChanges } from 'utils/hooks';
import { createSubmissionValidator, validateSubmission } from 'utils/submission/validate';

import PubHeader from '../PubHeader';
import PubHeaderSticky from '../PubHeader/PubHeaderSticky';
import { usePubContext } from '../pubHooks';
import ContributorsTab from './ContributorsTab';
import DetailsTab from './DetailsTab';
import InstructionsTab from './InstructionsTab';
import SpubHeaderToolBar from './SpubHeaderToolBar';

import './spubHeader.scss';

export type SpubHeaderTab = 'instructions' | 'details' | 'contributors' | 'preview';

const SpubHeader = () => {
	const { pendingPromise } = usePendingChanges();
	const { updatePubData, pubData, updateSubmissionState, submissionState } = usePubContext();
	const { selectedTab, submission } = submissionState!;
	const headerRef = useRef<HTMLDivElement>(null);

	const [validator] = useState(() => createSubmissionValidator(submission.submissionWorkflow));

	const { validatedFields } = useMemo(
		() =>
			validateSubmission(
				{
					title: pubData.title,
					description: pubData.description ?? '',
					abstract: submission.abstract,
				},
				validator,
			),
		[pubData, submission, validator],
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
		<div className="spub-header-component" ref={headerRef} data-tab={selectedTab}>
			<style>{`
				body { background-color: #f8f8f8; }
				.pub-document-component { background-color: white; }
			`}</style>
			<div className="content-container">
				<SpubHeaderToolBar
					validatedFields={validatedFields}
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
						submission={submission}
						validatedFields={validatedFields}
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
			<PubHeaderSticky />
		</div>
	);
};

export default () => (
	<PendingChangesProvider>
		<SpubHeader />
	</PendingChangesProvider>
);
