import React, { useState, useCallback } from 'react';
import { NonIdealState } from '@blueprintjs/core';

import { Collection, DefinitelyHas, Pub, PubsQuery, SubmissionStatus } from 'types';
import { useManyPubs } from 'client/utils/useManyPubs';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';

import {
	PubOverviewRow,
	OverviewRows,
	LoadMorePubsRow,
	SpecialRow,
} from '../DashboardOverview/overviewRows';
import { OverviewSearchGroup, OverviewSearchFilter } from '../DashboardOverview/helpers';
import ArbitrationMenu from './ArbitrationMenu';

require('./submissionItems.scss');

type Props = {
	collection: Collection;
	initialPubs: DefinitelyHas<Pub, 'submission'>[];
	initiallyLoadedAllPubs: boolean;
};

const EmptyState = (props: { isDoneSearching: boolean; initialPubs: Pub[]; pubs: Pub[] }) => {
	if (props.initialPubs.length === 0) {
		return (
			<NonIdealState
				icon="clean"
				title="There doesn't seem to be any submissions"
				description="Try reaching out to members of your community for submissions"
			/>
		);
	}
	if (props.pubs.length === 0 && props.isDoneSearching) {
		return <SpecialRow>No Submissions have been found.</SpecialRow>;
	}
	return null;
};

const queriesForSubmissionPubs: Record<string, Partial<PubsQuery>> = {
	default: {
		submissionStatuses: ['pending', 'accepted', 'declined'],
	},
	pending: {
		submissionStatuses: ['pending'],
	},
	accepted: {
		submissionStatuses: ['accepted'],
	},
	declined: {
		submissionStatuses: ['declined'],
	},
};

const overviewSearchFilters: OverviewSearchFilter[] = [
	{
		id: 'pending',
		title: 'Pending',
		query: queriesForSubmissionPubs.pending,
	},
	{ id: 'accepted', title: 'Accepted', query: queriesForSubmissionPubs.accepted },
	{ id: 'declined', title: 'Declined', query: queriesForSubmissionPubs.declined },
	{ id: 'all', title: 'All', query: queriesForSubmissionPubs.default },
];

const SubmissionItems = (props: Props) => {
	const { collection, initialPubs, initiallyLoadedAllPubs } = props;
	const [searchTerm, setSearchTerm] = useState('');
	const [filter, setFilter] = useState<null | Partial<PubsQuery>>(null);
	const isSearchingOrFiltering = !!filter || !!searchTerm;

	const {
		currentQuery: { pubs, isLoading, hasLoadedAllPubs, loadMorePubs },
	} = useManyPubs({
		isEager: isSearchingOrFiltering,
		initialPubs,
		initiallyLoadedAllPubs,
		batchSize: 200,
		pubOptions: { getSubmissions: true },
		query: {
			term: searchTerm,
			scopedCollectionId: collection.id,
			...filter,
		},
	});

	const [localStatuses, setLocalStatuses] = useState<{
		[pubId: string]: { status: SubmissionStatus; isDeleted: Boolean };
	}>({});
	const recordLocalStatus = useCallback((pubId: string, status: SubmissionStatus) => {
		setLocalStatuses((prev) => ({
			...prev,
			[pubId]: { status, isDeleted: !status },
		}));
	}, []);

	const canLoadMorePubs = !hasLoadedAllPubs;
	useInfiniteScroll({
		enabled: !isLoading && canLoadMorePubs,
		useDocumentElement: true,
		onRequestMoreItems: loadMorePubs,
	});

	const omitUpdatedSubmissions = (pub) =>
		!(pub.id in localStatuses) ||
		(!!localStatuses[pub.id].isDeleted &&
			filter?.submissionStatuses?.includes(localStatuses[pub.id].status));

	const augmentWithLocalStatus = (pub) => ({
		...pub,
		...(pub.id in localStatuses && {
			submission: { ...pub.submission, status: localStatuses[pub.id] },
		}),
	});

	return (
		<div className="submission-items-component">
			<OverviewSearchGroup
				placeholder="Enter keyword to search submissions"
				onUpdateSearchTerm={(t) => t === '' && setSearchTerm(t)}
				onCommitSearchTerm={setSearchTerm}
				onChooseFilter={setFilter}
				filters={overviewSearchFilters}
			/>
			<OverviewRows>
				{pubs
					.filter(omitUpdatedSubmissions)
					.map(augmentWithLocalStatus)
					.map((pub) => (
						<PubOverviewRow
							pub={pub}
							key={pub.id}
							leftIconElement="manually-entered-data"
							hasSubmission={true}
							isGrayscale={
								!!(pub.submission?.status === 'declined') ||
								localStatuses[pub.id]?.status === 'declined'
							}
							rightElement={
								<ArbitrationMenu pub={pub} onJudgePub={recordLocalStatus} />
							}
						/>
					))}
				{canLoadMorePubs && <LoadMorePubsRow isLoading />}
				<EmptyState
					pubs={pubs}
					initialPubs={initialPubs}
					isDoneSearching={hasLoadedAllPubs && isSearchingOrFiltering}
				/>
			</OverviewRows>
		</div>
	);
};

export default SubmissionItems;
