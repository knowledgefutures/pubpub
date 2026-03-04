import type { SpamUserQueryOrdering } from 'types';

import type { SpamUsersFilter } from './filters';
import type { SpamUser } from './types';

import React, { useCallback, useState } from 'react';

import { HTMLSelect, Spinner } from '@blueprintjs/core';
import { useDebounce, useUpdateEffect } from 'react-use';

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

const sortOptions = [
	{ value: 'user-created-at:DESC', label: 'Newest users' },
	{ value: 'user-created-at:ASC', label: 'Oldest users' },
	{ value: 'discussion-count:DESC', label: 'Most discussions' },
	{ value: 'discussion-count:ASC', label: 'Fewest discussions' },
	{ value: 'spam-score:DESC', label: 'Highest spam score' },
	{ value: 'spam-score:ASC', label: 'Lowest spam score' },
];

const parseSort = (value: string): SpamUserQueryOrdering => {
	const [field, direction] = value.split(':');
	return { field, direction } as SpamUserQueryOrdering;
};

const UserSpam = (props: Props) => {
	const { users: initialUsers, searchTerm: initialSearchTerm } = props;
	const [filter, setFilter] = useState(filtersById.all);
	const [inputSearchTerm, setInputSearchTerm] = useState(initialSearchTerm ?? '');
	const [searchTerm, setSearchTerm] = useState(initialSearchTerm ?? '');
	const [ordering, setOrdering] = useState<SpamUserQueryOrdering>(
		filtersById.all.query!.ordering,
	);
	const [communityInput, setCommunityInput] = useState('');
	const [communitySubdomain, setCommunitySubdomain] = useState('');

	useDebounce(() => setSearchTerm(inputSearchTerm), 300, [inputSearchTerm]);
	useDebounce(() => setCommunitySubdomain(communityInput.trim()), 300, [communityInput]);

	const { users, isLoading, loadMoreUsers, mayLoadMoreUsers, updateUser } = useSpamUsers({
		limit: 50,
		searchTerm,
		initialUsers,
		filter,
		ordering,
		communitySubdomain: communitySubdomain || undefined,
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

	const handleFilterChange = useCallback((newFilter: SpamUsersFilter) => {
		setFilter(newFilter);
		setOrdering(newFilter.query!.ordering);
	}, []);

	const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
		setOrdering(parseSort(e.target.value));
	}, []);

	return (
		<div className="user-spam-component">
			<OverviewSearchGroup
				filters={filters}
				placeholder="Search for users (name, email, slug)..."
				onUpdateSearchTerm={setInputSearchTerm}
				onCommitSearchTerm={(t) => {
					setInputSearchTerm(t);
					setSearchTerm(t);
				}}
				onChooseFilter={handleFilterChange}
				filter={filter}
				initialSearchTerm={initialSearchTerm ?? undefined}
				rightControls={isLoading && <Spinner size={20} />}
			/>
			<div className="controls-row">
				<span className="sort-control">
					Sort by
					<HTMLSelect
						value={`${ordering.field}:${ordering.direction}`}
						onChange={handleSortChange}
						minimal
					>
						{sortOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</HTMLSelect>
				</span>
				<label className="community-filter" htmlFor="community-subdomain-filter">
					Community
					<input
						id="community-subdomain-filter"
						type="text"
						placeholder="filter by subdomain..."
						value={communityInput}
						onChange={(e) => setCommunityInput(e.target.value)}
					/>
				</label>
			</div>
			<div className="users">
				{users.map((user) => (
					<UserSpamEntry
						user={user}
						key={user.id}
						onSpamTagRemoved={handleSpamTagRemoved}
					/>
				))}
				{!isLoading && users.length === 0 && (
					<div className="no-results">No users found</div>
				)}
			</div>
		</div>
	);
};

export default UserSpam;
