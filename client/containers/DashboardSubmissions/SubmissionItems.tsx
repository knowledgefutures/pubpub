import React, { useState } from 'react';
import { NonIdealState } from '@blueprintjs/core';

import { Collection, Pub, PubsQuery } from 'types';
import { useManyPubs } from 'client/utils/useManyPubs';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';

import {
	PubOverviewRow,
	OverviewRows,
	LoadMorePubsRow,
	SpecialRow,
} from '../DashboardOverview/overviewRows';
import { OverviewSearchGroup, OverviewSearchFilter } from '../DashboardOverview/helpers';

require('./submissionItems.scss');

type Props = {
	collection: Collection;
	initialPubs: Pub[];
	initiallyLoadedAllPubs: boolean;
};

const queriesForSubmissionPubs: Record<string, Partial<PubsQuery>> = {
	default: {
		submissionStatuses: ['incomplete', 'pending', 'accepted', 'declined'],
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
	{ id: 'all', title: 'All', query: queriesForSubmissionPubs.default },
	{
		id: 'pending',
		title: 'Pending',
		query: queriesForSubmissionPubs.pending,
	},
	{ id: 'accepted', title: 'Accepted', query: queriesForSubmissionPubs.accepted },
	{ id: 'declined', title: 'Declined', query: queriesForSubmissionPubs.declined },
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
		query: {
			term: searchTerm,
			scopedCollectionId: collection.id,
			...filter,
		},
	});

	const canLoadMorePubs = !hasLoadedAllPubs;
	useInfiniteScroll({
		enabled: !isLoading && canLoadMorePubs,
		useDocumentElement: true,
		onRequestMoreItems: loadMorePubs,
	});

	const renderPubs = () => {
		return pubs.map((pub) => (
			<PubOverviewRow pub={pub} key={pub.id} leftIconElement="manually-entered-data" />
		));
	};

	const renderEmptyState = () => {
		if (initialPubs.length === 0) {
			return (
				<NonIdealState
					icon="clean"
					title="There doesn't seem to be any submissions"
					description="No submissions have been submitted yet"
				/>
			);
		}
		if (pubs.length === 0 && hasLoadedAllPubs && isSearchingOrFiltering) {
			return <SpecialRow>No Submissions have been found.</SpecialRow>;
		}
		return null;
	};

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
				{renderPubs()}
				{canLoadMorePubs && <LoadMorePubsRow isLoading />}
				{renderEmptyState()}
			</OverviewRows>
		</div>
	);
};

export default SubmissionItems;
