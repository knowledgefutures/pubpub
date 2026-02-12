import type { SpamUser } from './types';

import React, { useCallback, useState } from 'react';

import { Spinner } from '@blueprintjs/core';
import { useUpdateEffect } from 'react-use';

import { OverviewSearchGroup } from 'client/containers/DashboardOverview/helpers';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';

import { filters, filtersById } from './filters';
import UserSpamEntry from './UserSpamEntry';
import { useSpamUsers } from './useSpamUsers';

import './userSpam.scss';

type Props = {
	users: SpamUser[];
	searchTerm: null | string;
};

const UserSpam = (props: Props) => {
	const { users: initialUsers, searchTerm: initialSearchTerm } = props;
	const [filter, setFilter] = useState(filtersById[initialSearchTerm ? 'all' : 'all']);
	const [searchTerm, setSearchTerm] = useState(initialSearchTerm ?? '');

	const { users, isLoading, loadMoreUsers, mayLoadMoreUsers, updateUser } = useSpamUsers({
		limit: 50,
		searchTerm,
		initialUsers,
		filter,
	});

	useInfiniteScroll({
		scrollTolerance: 100,
		useDocumentElement: true,
		onRequestMoreItems: loadMoreUsers,
		enabled: mayLoadMoreUsers,
	});

	useUpdateEffect(() => {
		const nextSearchPart = searchTerm ? `?q=${searchTerm}` : '';
		window.history.replaceState({}, '', window.location.pathname + nextSearchPart);
	}, [searchTerm]);

	const handleSpamTagRemoved = useCallback(
		(userId: string) => {
			updateUser(userId, { spamTag: null } as unknown as Partial<SpamUser>);
		},
		[updateUser],
	);

	return (
		<div className="user-spam-component">
			<OverviewSearchGroup
				filters={filters}
				placeholder="Search for users (name, email, slug)..."
				onUpdateSearchTerm={(t) => t === '' && setSearchTerm(t)}
				onCommitSearchTerm={setSearchTerm}
				onChooseFilter={setFilter}
				filter={filter}
				initialSearchTerm={initialSearchTerm ?? undefined}
				rightControls={isLoading && <Spinner size={20} />}
			/>
			<div className="users">
				{users.map((user) => (
					<UserSpamEntry
						user={user}
						key={user.id}
						onSpamTagRemoved={handleSpamTagRemoved}
					/>
				))}
			</div>
		</div>
	);
};

export default UserSpam;
