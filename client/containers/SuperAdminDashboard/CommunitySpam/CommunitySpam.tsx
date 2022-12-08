import React, { useState } from 'react';
import { Spinner } from '@blueprintjs/core';
import { useUpdateEffect } from 'react-use';

import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';
import { OverviewSearchGroup } from 'client/containers/DashboardOverview/helpers';

import { filters, filtersById } from './filters';
import { CommunityWithSpam } from './types';
import { useSpamCommunities } from './useSpamCommunities';
import CommunitySpamEntry from './CommunitySpamEntry';

require('./communitySpam.scss');

type Props = {
	communities: CommunityWithSpam[];
	searchTerm: null | string;
};

const CommunitySpam = (props: Props) => {
	const { communities: initialCommunities, searchTerm: initialSearchTerm } = props;
	const [filter, setFilter] = useState(filtersById[initialSearchTerm ? 'recent' : 'unreviewed']);
	const [searchTerm, setSearchTerm] = useState(initialSearchTerm ?? '');

	const { communities, isLoading, loadMoreCommunities, mayLoadMoreCommunities } =
		useSpamCommunities({
			limit: 50,
			searchTerm,
			initialCommunities,
			filter,
		});

	useInfiniteScroll({
		scrollTolerance: 0,
		useDocumentElement: true,
		onRequestMoreItems: loadMoreCommunities,
		enabled: mayLoadMoreCommunities,
	});

	useUpdateEffect(() => {
		const nextSearchPart = searchTerm ? `?q=${searchTerm}` : '';
		window.history.replaceState({}, '', window.location.pathname + nextSearchPart);
	}, [searchTerm]);

	return (
		<div className="community-spam-component">
			<OverviewSearchGroup
				filters={filters}
				placeholder="Search for Communities..."
				onUpdateSearchTerm={(t) => t === '' && setSearchTerm(t)}
				onCommitSearchTerm={setSearchTerm}
				onChooseFilter={setFilter}
				filter={filter}
				initialSearchTerm={initialSearchTerm ?? undefined}
				rightControls={isLoading && <Spinner size={20} />}
			/>
			<div className="communities">
				{communities.map((community) => (
					<CommunitySpamEntry community={community} key={community.id} />
				))}
			</div>
		</div>
	);
};

export default CommunitySpam;
