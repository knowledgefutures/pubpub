import type { SpamUsersFilter } from './filters';
import type { SpamUser } from './types';

import { useCallback, useState } from 'react';

import { useUpdateEffect } from 'react-use';
import useStateRef from 'react-usestateref';

import { apiFetch } from 'client/utils/apiFetch';
import { unique } from 'utils/arrays';

type UseSpamUsersOptions = {
	filter: SpamUsersFilter;
	searchTerm: string;
	initialUsers: SpamUser[];
	limit: number;
};

export const useSpamUsers = (options: UseSpamUsersOptions) => {
	const { searchTerm, filter, limit, initialUsers } = options;
	const [_, setOffset, offsetRef] = useStateRef(initialUsers.length);
	const [isLoading, setIsLoading] = useState(false);
	const [mayLoadMoreUsers, setMayLoadMoreUsers] = useState(true);
	const [users, setUsers] = useState(initialUsers);

	const loadMoreUsers = useCallback(async () => {
		const currentOffset = offsetRef.current;
		setIsLoading(true);
		setMayLoadMoreUsers(false);
		setOffset((offset) => offset + limit);
		const { status, ordering } = filter.query!;
		const nextUsers = await apiFetch.post('/api/spamTags/queryUsersForSpam', {
			limit,
			searchTerm,
			offset: currentOffset,
			status,
			ordering,
		});
		setIsLoading(false);
		setTimeout(() => setMayLoadMoreUsers(nextUsers.length === limit), 0);
		setUsers((currentUsers) => unique([...currentUsers, ...nextUsers], (u) => u.id));
	}, [filter.query, limit, searchTerm, offsetRef, setOffset]);

	useUpdateEffect(() => {
		setOffset(0);
		setUsers([]);
		loadMoreUsers();
	}, [setOffset, loadMoreUsers, filter]);

	const prependUser = useCallback((user: SpamUser) => {
		setUsers((current) => {
			const seen = new Set(current.map((u) => u.id));
			if (seen.has(user.id)) return current;
			return [user, ...current];
		});
	}, []);

	return { users, isLoading, loadMoreUsers, mayLoadMoreUsers, prependUser };
};
