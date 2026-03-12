import type { SpamUserQueryOrdering } from 'types';

import type { SpamUsersFilter } from './filters';
import type { SpamUser } from './types';

import { useCallback, useState } from 'react';

import { useUpdateEffect } from 'react-use';
import useStateRef from 'react-usestateref';

import { apiFetch } from 'client/utils/apiFetch';
import { unique } from 'utils/arrays';

type QueryFilters = {
	createdAfter?: string;
	createdBefore?: string;
	activeAfter?: string;
	activeBefore?: string;
	minActivities?: number;
	maxActivities?: number;
	spamFieldsFilter?: string[];
};

type UseSpamUsersOptions = {
	filter: SpamUsersFilter;
	ordering: SpamUserQueryOrdering;
	searchTerm: string;
	initialUsers: SpamUser[];
	limit: number;
	communitySubdomain?: string;
	queryFilters?: QueryFilters;
};

export const useSpamUsers = (options: UseSpamUsersOptions) => {
	const { searchTerm, filter, ordering, limit, initialUsers, communitySubdomain, queryFilters } =
		options;
	const [_, setOffset, offsetRef] = useStateRef(initialUsers.length);
	const [isLoading, setIsLoading] = useState(false);
	const [mayLoadMoreUsers, setMayLoadMoreUsers] = useState(true);
	const [users, setUsers] = useState(initialUsers);

	const loadMoreUsers = useCallback(async () => {
		const currentOffset = offsetRef.current;
		setIsLoading(true);
		setMayLoadMoreUsers(false);
		setOffset((offset) => offset + limit);
		const { status, spamTagPresence, hasCommunityBan } = filter.query!;
		const nextUsers = await apiFetch.post('/api/spamTags/queryUsersForSpam', {
			limit,
			searchTerm,
			offset: currentOffset,
			status,
			ordering,
			spamTagPresence,
			hasCommunityBan,
			communitySubdomain: communitySubdomain || undefined,
			...queryFilters,
		});
		setIsLoading(false);
		setTimeout(() => setMayLoadMoreUsers(nextUsers.length === limit), 0);
		setUsers((currentUsers) => unique([...currentUsers, ...nextUsers], (u) => u.id));
	}, [
		filter.query,
		limit,
		searchTerm,
		ordering,
		communitySubdomain,
		queryFilters,
		offsetRef,
		setOffset,
	]);

	useUpdateEffect(() => {
		setOffset(0);
		setUsers([]);
		loadMoreUsers();
	}, [setOffset, loadMoreUsers, filter]);

	const updateUser = useCallback((userId: string, patch: Partial<SpamUser>) => {
		setUsers((current) => current.map((u) => (u.id === userId ? { ...u, ...patch } : u)));
	}, []);

	return { users, isLoading, loadMoreUsers, mayLoadMoreUsers, updateUser };
};
