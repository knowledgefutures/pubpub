import type { SpamUserQueryOrdering } from 'types';

import type { SpamUsersFilter } from './filters';
import type { SpamUser } from './types';

import React, { useCallback, useMemo, useState } from 'react';

import { Button, ButtonGroup, HTMLSelect, Spinner } from '@blueprintjs/core';
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
	{ value: 'last-activity:DESC', label: 'Most recently active' },
	{ value: 'last-activity:ASC', label: 'Least recently active' },
	{ value: 'activity-count:DESC', label: 'Most activities' },
	{ value: 'activity-count:ASC', label: 'Fewest activities' },
	{ value: 'discussion-count:DESC', label: 'Most discussions' },
	{ value: 'discussion-count:ASC', label: 'Fewest discussions' },
	{ value: 'spam-score:DESC', label: 'Highest spam score' },
	{ value: 'spam-score:ASC', label: 'Lowest spam score' },
];

type DatePreset = { label: string; days: number };

const datePresets: DatePreset[] = [
	{ label: '24h', days: 1 },
	{ label: '7d', days: 7 },
	{ label: '30d', days: 30 },
	{ label: '90d', days: 90 },
];

const daysAgo = (n: number): string => {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString();
};

const toDateInputValue = (iso: string): string => iso.slice(0, 10);

const fromDateInputValue = (val: string): string | undefined => {
	if (!val) return undefined;
	return new Date(val).toISOString();
};

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
	const [createdAfter, setCreatedAfter] = useState<string | undefined>();
	const [createdBefore, setCreatedBefore] = useState<string | undefined>();
	const [activeAfter, setActiveAfter] = useState<string | undefined>();
	const [activeBefore, setActiveBefore] = useState<string | undefined>();
	const [createdPreset, setCreatedPreset] = useState<number | null>(null);
	const [activePreset, setActivePreset] = useState<number | null>(null);
	const [minActivitiesInput, setMinActivitiesInput] = useState('');
	const [maxActivitiesInput, setMaxActivitiesInput] = useState('');
	const [minActivities, setMinActivities] = useState<number | undefined>();
	const [maxActivities, setMaxActivities] = useState<number | undefined>();

	useDebounce(() => setSearchTerm(inputSearchTerm), 300, [inputSearchTerm]);
	useDebounce(() => setCommunitySubdomain(communityInput.trim()), 300, [communityInput]);
	useDebounce(
		() => setMinActivities(minActivitiesInput ? Number(minActivitiesInput) : undefined),
		300,
		[minActivitiesInput],
	);
	useDebounce(
		() => setMaxActivities(maxActivitiesInput ? Number(maxActivitiesInput) : undefined),
		300,
		[maxActivitiesInput],
	);

	const queryFilters = useMemo(
		() => ({
			createdAfter,
			createdBefore,
			activeAfter,
			activeBefore,
			minActivities,
			maxActivities,
		}),
		[createdAfter, createdBefore, activeAfter, activeBefore, minActivities, maxActivities],
	);

	const { users, isLoading, loadMoreUsers, mayLoadMoreUsers, updateUser } = useSpamUsers({
		limit: 50,
		searchTerm,
		initialUsers,
		filter,
		ordering,
		communitySubdomain: communitySubdomain || undefined,
		queryFilters,
	});

	useInfiniteScroll({
		scrollTolerance: 500,
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

	const handleStatusChanged = useCallback(
		(userId: string, status: string) => {
			updateUser(userId, {
				spamTag: { status } as SpamUser['spamTag'],
			} as Partial<SpamUser>);
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
				<span className="activity-count-filter">
					Activities
					<input
						type="number"
						min="0"
						placeholder="min"
						value={minActivitiesInput}
						onChange={(e) => setMinActivitiesInput(e.target.value)}
					/>
					<span>to</span>
					<input
						type="number"
						min="0"
						placeholder="max"
						value={maxActivitiesInput}
						onChange={(e) => setMaxActivitiesInput(e.target.value)}
					/>
				</span>
			</div>
			<div className="date-filters-row">
				<div className="date-filter-group">
					<span className="date-filter-label">Created</span>
					<ButtonGroup minimal>
						{datePresets.map((p) => (
							<Button
								key={p.label}
								small
								active={createdPreset === p.days}
								onClick={() => {
									if (createdPreset === p.days) {
										setCreatedPreset(null);
										setCreatedAfter(undefined);
										setCreatedBefore(undefined);
										return;
									}
									setCreatedPreset(p.days);
									setCreatedAfter(daysAgo(p.days));
									setCreatedBefore(undefined);
								}}
							>
								{p.label}
							</Button>
						))}
					</ButtonGroup>
					<input
						type="date"
						value={createdAfter ? toDateInputValue(createdAfter) : ''}
						onChange={(e) => {
							setCreatedPreset(null);
							setCreatedAfter(fromDateInputValue(e.target.value));
						}}
					/>
					<span>to</span>
					<input
						type="date"
						value={createdBefore ? toDateInputValue(createdBefore) : ''}
						onChange={(e) => {
							setCreatedPreset(null);
							setCreatedBefore(fromDateInputValue(e.target.value));
						}}
					/>
					{(createdAfter || createdBefore) && (
						<Button
							small
							minimal
							icon="cross"
							onClick={() => {
								setCreatedPreset(null);
								setCreatedAfter(undefined);
								setCreatedBefore(undefined);
							}}
						/>
					)}
				</div>
				<div className="date-filter-group">
					<span className="date-filter-label">Active</span>
					<ButtonGroup minimal>
						{datePresets.map((p) => (
							<Button
								key={p.label}
								small
								active={activePreset === p.days}
								onClick={() => {
									if (activePreset === p.days) {
										setActivePreset(null);
										setActiveAfter(undefined);
										setActiveBefore(undefined);
										return;
									}
									setActivePreset(p.days);
									setActiveAfter(daysAgo(p.days));
									setActiveBefore(undefined);
								}}
							>
								{p.label}
							</Button>
						))}
					</ButtonGroup>
					<input
						type="date"
						value={activeAfter ? toDateInputValue(activeAfter) : ''}
						onChange={(e) => {
							setActivePreset(null);
							setActiveAfter(fromDateInputValue(e.target.value));
						}}
					/>
					<span>to</span>
					<input
						type="date"
						value={activeBefore ? toDateInputValue(activeBefore) : ''}
						onChange={(e) => {
							setActivePreset(null);
							setActiveBefore(fromDateInputValue(e.target.value));
						}}
					/>
					{(activeAfter || activeBefore) && (
						<Button
							small
							minimal
							icon="cross"
							onClick={() => {
								setActivePreset(null);
								setActiveAfter(undefined);
								setActiveBefore(undefined);
							}}
						/>
					)}
				</div>
			</div>
			<div className="users">
				{users.map((user) => (
					<UserSpamEntry
						user={user}
						key={user.id}
						onSpamTagRemoved={handleSpamTagRemoved}
						onStatusChanged={handleStatusChanged}
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
