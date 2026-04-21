import type { SpamCommunitiesFilter } from './filters';
import type { CommunityWithSpam } from './types';

import { useCallback, useState } from 'react';

import { useUpdateEffect } from 'react-use';

import { apiFetch } from 'client/utils/apiFetch';

type UseSpamCommunitiesOptions = {
	filter: SpamCommunitiesFilter;
	searchTerm: string;
	initialCommunities: CommunityWithSpam[];
	initialTotalCount: number;
	pageSize: number;
};

export const useSpamCommunities = (options: UseSpamCommunitiesOptions) => {
	const { searchTerm, filter, pageSize, initialCommunities, initialTotalCount } = options;
	const [isLoading, setIsLoading] = useState(false);
	const [communities, setCommunities] = useState(initialCommunities);
	const [totalCount, setTotalCount] = useState(initialTotalCount);
	const [page, setPage] = useState(0);

	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

	const fetchPage = useCallback(
		async (targetPage: number) => {
			setIsLoading(true);
			const { status, ordering, approvalRequested } = filter.query!;
			const result = await apiFetch.post('/api/spamTags/queryCommunitiesForSpam', {
				limit: pageSize,
				searchTerm,
				offset: targetPage * pageSize,
				status,
				ordering,
				approvalRequested,
			});
			setCommunities(result.communities);
			setTotalCount(result.totalCount);
			setPage(targetPage);
			setIsLoading(false);
		},
		[filter.query, pageSize, searchTerm],
	);

	const goToNextPage = useCallback(() => {
		if (page < totalPages - 1) {
			fetchPage(page + 1);
		}
	}, [page, totalPages, fetchPage]);

	const goToPrevPage = useCallback(() => {
		if (page > 0) {
			fetchPage(page - 1);
		}
	}, [page, fetchPage]);

	useUpdateEffect(() => {
		fetchPage(0);
	}, [fetchPage, filter]);

	return { communities, isLoading, page, totalPages, totalCount, goToNextPage, goToPrevPage };
};
