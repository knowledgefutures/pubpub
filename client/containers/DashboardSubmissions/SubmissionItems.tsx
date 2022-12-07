import React, { useState } from 'react';
import { AnchorButton, NonIdealState } from '@blueprintjs/core';

import { Collection, PubsQuery } from 'types';
import { useManyPubs } from 'client/utils/useManyPubs';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';
import { collectionUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';

import { OverviewRows, LoadMorePubsRow, SpecialRow } from '../DashboardOverview/overviewRows';
import { OverviewSearchGroup, PubsOverviewSearchFilter } from '../DashboardOverview/helpers';

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
		submissionStatuses: ['received', 'accepted', 'declined'],
	},
	received: {
		submissionStatuses: ['received'],
	},
	accepted: {
		submissionStatuses: ['accepted'],
	},
	declined: {
		submissionStatuses: ['declined'],
	},
};

const pendingSearchFilter: PubsOverviewSearchFilter = {
	id: 'received',
	title: 'Received',
	query: queriesForSubmissionPubs.received,
};

const overviewSearchFilters: PubsOverviewSearchFilter[] = [
	pendingSearchFilter,
	{ id: 'accepted', title: 'Accepted', query: queriesForSubmissionPubs.accepted },
	{ id: 'declined', title: 'Declined', query: queriesForSubmissionPubs.declined },
	{ id: 'all', title: 'All', query: queriesForSubmissionPubs.all },
];

const SubmissionItems = (props: Props) => {
	const { collection, initialPubs, initiallyLoadedAllPubs, acceptSubmissionsToggle } = props;
	const { communityData } = usePageContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [filter, setFilter] = useState<PubsOverviewSearchFilter>(pendingSearchFilter);
	const isSearchingOrFiltering = !!filter || !!searchTerm;

	const {
		currentQuery: { pubs: foundPubs, isLoading, hasLoadedAllPubs, loadMorePubs },
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

	const pubs = foundPubs.filter(
		(pub) => pub.submission?.submissionWorkflow?.collectionId === collection.id,
	);

	const canLoadMorePubs = !hasLoadedAllPubs;
	useInfiniteScroll({
		enabled: !isLoading && canLoadMorePubs,
		useDocumentElement: true,
		onRequestMoreItems: loadMorePubs,
	});

	const renderEmptyState = () => {
		if (pubs.length === 0 && hasLoadedAllPubs) {
			if (filter === pendingSearchFilter && !searchTerm) {
				const action = acceptSubmissionsToggle || (
					<AnchorButton
						href={collectionUrl(communityData, collection)}
						target="_blank"
						outlined
						icon="share"
					>
						Go to layout
					</AnchorButton>
				);

				const description = acceptSubmissionsToggle
					? 'Ready to start accepting submissions?'
					: "Guests can visit this Collection's layout to start a submission.";

				return (
					<NonIdealState
						icon="clean"
						title="There aren't any submissions to review"
						description={description}
						action={action}
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
