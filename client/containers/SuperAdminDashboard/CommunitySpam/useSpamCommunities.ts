import { useCallback, useState } from 'react';
import useStateRef from 'react-usestateref';
import { useUpdateEffect } from 'react-use';

import { apiFetch } from 'client/utils/apiFetch';
import { unique } from 'utils/arrays';

import { CommunityWithSpam } from './types';
import { SpamCommunitiesFilter } from './filters';

type UseSpamCommunitiesOptions = {
	filter: SpamCommunitiesFilter;
	searchTerm: string;
	initialCommunities: CommunityWithSpam[];
	limit: number;
};

export const useSpamCommunities = (options: UseSpamCommunitiesOptions) => {
	const { searchTerm, filter, limit, initialCommunities } = options;
	const [_, setOffset, offsetRef] = useStateRef(initialCommunities.length);
	const [isLoading, setIsLoading] = useState(false);
	const [mayLoadMoreCommunities, setMayLoadMoreCommunities] = useState(true);
	const [communities, setCommunities] = useState(initialCommunities);

	const loadMoreCommunities = useCallback(async () => {
		const currentOffset = offsetRef.current;
		setIsLoading(true);
		setMayLoadMoreCommunities(false);
		setOffset((offset) => offset + limit);
		const { status, ordering } = filter.query!;
		const nextCommunities = await apiFetch.post(`/api/spamTags/queryCommunitiesForSpam?`, {
			limit,
			searchTerm,
			offset: currentOffset,
			status,
			ordering,
		});
		setIsLoading(false);
		setTimeout(() => setMayLoadMoreCommunities(nextCommunities.length === limit), 0);
		setCommunities((currentCommunities) =>
			unique([...currentCommunities, ...nextCommunities], (c) => c.id),
		);
	}, [setMayLoadMoreCommunities, filter.query, limit, searchTerm, offsetRef, setOffset]);

	useUpdateEffect(() => {
		setOffset(0);
		setCommunities([]);
		loadMoreCommunities();
	}, [setOffset, loadMoreCommunities, filter]);

	return { communities, isLoading, loadMoreCommunities, mayLoadMoreCommunities };
};
