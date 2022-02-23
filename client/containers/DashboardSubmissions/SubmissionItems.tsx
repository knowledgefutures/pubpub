import React, { useState } from 'react';
import { NonIdealState } from '@blueprintjs/core';

import { Collection, PubsQuery } from 'types';
import { useManyPubs } from 'client/utils/useManyPubs';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';

import { OverviewRows, LoadMorePubsRow, SpecialRow } from '../DashboardOverview/overviewRows';
import { OverviewSearchGroup, OverviewSearchFilter } from '../DashboardOverview/helpers';

import { PubWithSubmission } from './types';
import SubmissionRow from './SubmissionRow';

require('./submissionItems.scss');

type Props = {
	collection: Collection;
	initialPubs: PubWithSubmission[];
	initiallyLoadedAllPubs: boolean;
	acceptSubmissionsToggle: null | React.ReactElement;
};

const queriesForSubmissionPubs: Record<string, Partial<PubsQuery>> = {
	all: {
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

const pendingSearchFilter: OverviewSearchFilter = {
	id: 'pending',
	title: 'Submitted',
	query: queriesForSubmissionPubs.pending,
};

const overviewSearchFilters: OverviewSearchFilter[] = [
	pendingSearchFilter,
	{ id: 'accepted', title: 'Accepted', query: queriesForSubmissionPubs.accepted },
	{ id: 'declined', title: 'Declined', query: queriesForSubmissionPubs.declined },
	{ id: 'all', title: 'All', query: queriesForSubmissionPubs.all },
];

const SubmissionItems = (props: Props) => {
	const { collection, initialPubs, initiallyLoadedAllPubs, acceptSubmissionsToggle } = props;
	const [searchTerm, setSearchTerm] = useState('');
	const [filter, setFilter] = useState<OverviewSearchFilter>(pendingSearchFilter);
	const isSearchingOrFiltering = !!filter || !!searchTerm;

	const {
		currentQuery: { pubs, isLoading, hasLoadedAllPubs, loadMorePubs },
	} = useManyPubs<PubWithSubmission>({
		isEager: isSearchingOrFiltering,
		initialPubs,
		initiallyLoadedAllPubs,
		batchSize: 200,
		cacheQueries: false,
		pubOptions: { getSubmissions: true },
		query: {
			term: searchTerm,
			scopedCollectionId: collection.id,
			...filter?.query,
		},
	});

	const canLoadMorePubs = !hasLoadedAllPubs;
	useInfiniteScroll({
		enabled: !isLoading && canLoadMorePubs,
		useDocumentElement: true,
		onRequestMoreItems: loadMorePubs,
	});

	const renderEmptyState = () => {
		if (pubs.length === 0 && hasLoadedAllPubs) {
			if (filter === pendingSearchFilter && !searchTerm) {
				return (
					<NonIdealState
						icon="clean"
						title="There aren't any submissions to review."
						{...(acceptSubmissionsToggle ? { action: acceptSubmissionsToggle } : {})}
					/>
				);
			}
			return <SpecialRow>No matching Submissions.</SpecialRow>;
		}
		return null;
	};

	return (
		<div className="submission-items-component">
			<OverviewSearchGroup
				placeholder="Search for submitted Pubs"
				onUpdateSearchTerm={(t) => t === '' && setSearchTerm(t)}
				onCommitSearchTerm={setSearchTerm}
				onChooseFilter={setFilter}
				filters={overviewSearchFilters}
			/>
			<OverviewRows>
				{pubs.map((pub) => (
					<SubmissionRow pub={pub} key={pub.id} />
				))}
				{canLoadMorePubs && <LoadMorePubsRow isLoading />}
				{renderEmptyState()}
			</OverviewRows>
		</div>
	);
};

export default SubmissionItems;
