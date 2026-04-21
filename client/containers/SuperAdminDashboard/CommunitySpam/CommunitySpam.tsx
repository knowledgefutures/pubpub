import type { CommunityWithSpam } from './types';

import React, { useState } from 'react';

import { Button, ButtonGroup, Spinner } from '@blueprintjs/core';
import { useUpdateEffect } from 'react-use';

import { OverviewSearchGroup } from 'client/containers/DashboardOverview/helpers';

import CommunitySpamEntry from './CommunitySpamEntry';
import { filters, filtersById } from './filters';
import { useSpamCommunities } from './useSpamCommunities';

import './communitySpam.scss';

const PAGE_SIZE = 100;

type Props = {
	communities: CommunityWithSpam[];
	totalCount: number;
	searchTerm: null | string;
};

const CommunitySpam = (props: Props) => {
	const {
		communities: initialCommunities,
		totalCount: initialTotalCount,
		searchTerm: initialSearchTerm,
	} = props;
	const [filter, setFilter] = useState(filtersById[initialSearchTerm ? 'recent' : 'unreviewed']);
	const [searchTerm, setSearchTerm] = useState(initialSearchTerm ?? '');

	const { communities, isLoading, page, totalPages, totalCount, goToNextPage, goToPrevPage } =
		useSpamCommunities({
			pageSize: PAGE_SIZE,
			searchTerm,
			initialCommunities,
			initialTotalCount,
			filter,
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
			{totalPages > 1 && (
				<div className="pagination-controls">
					<ButtonGroup>
						<Button
							icon="chevron-left"
							disabled={page === 0 || isLoading}
							onClick={goToPrevPage}
						>
							Previous
						</Button>
						<Button disabled className="page-indicator">
							Page {page + 1} of {totalPages} ({totalCount} total)
						</Button>
						<Button
							rightIcon="chevron-right"
							disabled={page >= totalPages - 1 || isLoading}
							onClick={goToNextPage}
						>
							Next
						</Button>
					</ButtonGroup>
				</div>
			)}
		</div>
	);
};

export default CommunitySpam;
