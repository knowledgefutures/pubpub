import React, { useMemo, useRef, useState } from 'react';

import { DocJson, Pub, PubPageData } from 'types';
import { PendingChangesProvider } from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { useSticky } from 'client/utils/useSticky';
import { usePendingChanges } from 'utils/hooks';
import { createSubmissionValidator, validateSubmission } from 'utils/submission/validate';

import { usePubContext } from '../pubHooks';
import PubHeader from '../PubHeader';
import { getPubHeadings } from '../PubHeader/headerUtils';
import PubHeaderSticky from '../PubHeader/PubHeaderSticky';
import InstructionsTab from './InstructionsTab';
import DetailsTab from './DetailsTab';
import ContributorsTab from './ContributorsTab';
import SpubHeaderToolBar from './SpubHeaderToolBar';

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
			<PubHeaderSticky pubData={pubData} pubHeadings={pubHeadings} />
		</div>
	);
};

export default () => (
	<PendingChangesProvider>
		<SpubHeader />
	</PendingChangesProvider>
);
