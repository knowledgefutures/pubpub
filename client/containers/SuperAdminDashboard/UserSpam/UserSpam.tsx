import type { SpamFieldsFilterKey, SpamStatus, SpamUserQueryOrdering } from 'types';

import type { SpamUsersFilter } from './filters';
import type { SpamUser } from './types';

import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Button, ButtonGroup, Checkbox, HTMLSelect, Spinner } from '@blueprintjs/core';
import { useDebounce, useUpdateEffect } from 'react-use';

import { Popover } from 'client/components';
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

const spamFieldOptions: { key: SpamFieldsFilterKey; label: string }[] = [
	{ key: 'honeypotTriggers', label: 'Honeypot triggers' },
	{ key: 'suspiciousFiles', label: 'Suspicious files' },
	{ key: 'suspiciousComments', label: 'Suspicious comments' },
	{ key: 'manuallyMarkedBy', label: 'Manually marked' },
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

const readUrlParams = () => {
	if (typeof window === 'undefined') return {};
	const params = new URLSearchParams(window.location.search);
	const get = (key: string) => params.get(key) || undefined;
	return {
		q: get('q'),
		filter: get('filter'),
		sort: get('sort'),
		community: get('community'),
		createdAfter: get('createdAfter'),
		createdBefore: get('createdBefore'),
		activeAfter: get('activeAfter'),
		activeBefore: get('activeBefore'),
		minActivities: get('minActivities'),
		maxActivities: get('maxActivities'),
		spamFields: get('spamFields'),
	};
};

const buildUrlParams = (state: {
	searchTerm: string;
	filterId: string;
	ordering: SpamUserQueryOrdering;
	communitySubdomain: string;
	createdAfter?: string;
	createdBefore?: string;
	activeAfter?: string;
	activeBefore?: string;
	minActivities?: number;
	maxActivities?: number;
	spamFieldsFilter?: SpamFieldsFilterKey[];
}) => {
	const params = new URLSearchParams();
	if (state.searchTerm) params.set('q', state.searchTerm);
	if (state.filterId && state.filterId !== 'all') params.set('filter', state.filterId);
	const sortStr = `${state.ordering.field}:${state.ordering.direction}`;
	const defaultSort = `${(filtersById[state.filterId] ?? filtersById.all).query!.ordering.field}:${(filtersById[state.filterId] ?? filtersById.all).query!.ordering.direction}`;
	if (sortStr !== defaultSort) params.set('sort', sortStr);
	if (state.communitySubdomain) params.set('community', state.communitySubdomain);
	if (state.createdAfter) params.set('createdAfter', state.createdAfter);
	if (state.createdBefore) params.set('createdBefore', state.createdBefore);
	if (state.activeAfter) params.set('activeAfter', state.activeAfter);
	if (state.activeBefore) params.set('activeBefore', state.activeBefore);
	if (state.minActivities != null) params.set('minActivities', String(state.minActivities));
	if (state.maxActivities != null) params.set('maxActivities', String(state.maxActivities));
	if (state.spamFieldsFilter?.length) params.set('spamFields', state.spamFieldsFilter.join(','));
	const qs = params.toString();
	return qs ? `?${qs}` : '';
};

const UserSpam = (props: Props) => {
	const { users: initialUsers, searchTerm: initialSearchTerm } = props;
	const urlParams = useRef(readUrlParams()).current;

	const initialFilterId = urlParams.filter ?? 'all';
	const initialFilter = filtersById[initialFilterId] ?? filtersById.all;
	const initialOrdering = urlParams.sort
		? parseSort(urlParams.sort)
		: initialFilter.query!.ordering;

	const [filter, setFilter] = useState(initialFilter);
	const [inputSearchTerm, setInputSearchTerm] = useState(initialSearchTerm ?? '');
	const [searchTerm, setSearchTerm] = useState(initialSearchTerm ?? '');
	const [ordering, setOrdering] = useState<SpamUserQueryOrdering>(initialOrdering);
	const [communityInput, setCommunityInput] = useState(urlParams.community ?? '');
	const [communitySubdomain, setCommunitySubdomain] = useState(urlParams.community ?? '');
	const [createdAfter, setCreatedAfter] = useState<string | undefined>(urlParams.createdAfter);
	const [createdBefore, setCreatedBefore] = useState<string | undefined>(urlParams.createdBefore);
	const [activeAfter, setActiveAfter] = useState<string | undefined>(urlParams.activeAfter);
	const [activeBefore, setActiveBefore] = useState<string | undefined>(urlParams.activeBefore);
	const [createdPreset, setCreatedPreset] = useState<number | null>(null);
	const [activePreset, setActivePreset] = useState<number | null>(null);
	const [minActivitiesInput, setMinActivitiesInput] = useState(urlParams.minActivities ?? '');
	const [maxActivitiesInput, setMaxActivitiesInput] = useState(urlParams.maxActivities ?? '');
	const [minActivities, setMinActivities] = useState<number | undefined>(
		urlParams.minActivities ? Number(urlParams.minActivities) : undefined,
	);
	const [maxActivities, setMaxActivities] = useState<number | undefined>(
		urlParams.maxActivities ? Number(urlParams.maxActivities) : undefined,
	);
	const [spamFieldsFilter, setSpamFieldsFilter] = useState<SpamFieldsFilterKey[]>(
		urlParams.spamFields ? (urlParams.spamFields.split(',') as SpamFieldsFilterKey[]) : [],
	);

	const toggleSpamField = useCallback((key: SpamFieldsFilterKey) => {
		setSpamFieldsFilter((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
		);
	}, []);

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
			spamFieldsFilter: spamFieldsFilter.length > 0 ? spamFieldsFilter : undefined,
		}),
		[
			createdAfter,
			createdBefore,
			activeAfter,
			activeBefore,
			minActivities,
			maxActivities,
			spamFieldsFilter,
		],
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
		const qs = buildUrlParams({
			searchTerm,
			filterId: filter.id,
			ordering,
			communitySubdomain,
			createdAfter,
			createdBefore,
			activeAfter,
			activeBefore,
			minActivities,
			maxActivities,
			spamFieldsFilter: spamFieldsFilter.length > 0 ? spamFieldsFilter : undefined,
		});
		window.history.replaceState({}, '', window.location.pathname + qs);
	}, [
		searchTerm,
		filter,
		ordering,
		communitySubdomain,
		createdAfter,
		createdBefore,
		activeAfter,
		activeBefore,
		minActivities,
		maxActivities,
		spamFieldsFilter,
	]);

	const handleStatusChanged = useCallback(
		(userId: string, status: SpamStatus | null) => {
			if (status === null) {
				updateUser(userId, { spamTag: undefined });
				return;
			}

			updateUser(userId, {
				spamTag: { status },
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
			<div className="toolbar">
				<HTMLSelect
					className="toolbar-sort"
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
				<input
					className="toolbar-input community-input"
					type="text"
					placeholder="Community..."
					value={communityInput}
					onChange={(e) => setCommunityInput(e.target.value)}
				/>
				<Popover
					aria-label="Filter by created date"
					placement="bottom-start"
					content={
						<div className="popover-panel">
							<div className="popover-panel-title">Created date</div>
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
							<div className="popover-date-row">
								<input
									type="date"
									value={createdAfter ? toDateInputValue(createdAfter) : ''}
									onChange={(e) => {
										setCreatedPreset(null);
										setCreatedAfter(fromDateInputValue(e.target.value));
									}}
								/>
								<span className="popover-date-sep">to</span>
								<input
									type="date"
									value={createdBefore ? toDateInputValue(createdBefore) : ''}
									onChange={(e) => {
										setCreatedPreset(null);
										setCreatedBefore(fromDateInputValue(e.target.value));
									}}
								/>
							</div>
							{(createdAfter || createdBefore) && (
								<Button
									small
									minimal
									icon="cross"
									text="Clear"
									onClick={() => {
										setCreatedPreset(null);
										setCreatedAfter(undefined);
										setCreatedBefore(undefined);
									}}
								/>
							)}
						</div>
					}
				>
					<Button
						small
						minimal
						icon="calendar"
						active={!!(createdAfter || createdBefore)}
					>
						Created
						{createdPreset
							? `: ${datePresets.find((p) => p.days === createdPreset)?.label}`
							: createdAfter || createdBefore
								? ' (custom)'
								: ''}
					</Button>
				</Popover>
				<Popover
					aria-label="Filter by active date"
					placement="bottom-start"
					content={
						<div className="popover-panel">
							<div className="popover-panel-title">Active date</div>
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
							<div className="popover-date-row">
								<input
									type="date"
									value={activeAfter ? toDateInputValue(activeAfter) : ''}
									onChange={(e) => {
										setActivePreset(null);
										setActiveAfter(fromDateInputValue(e.target.value));
									}}
								/>
								<span className="popover-date-sep">to</span>
								<input
									type="date"
									value={activeBefore ? toDateInputValue(activeBefore) : ''}
									onChange={(e) => {
										setActivePreset(null);
										setActiveBefore(fromDateInputValue(e.target.value));
									}}
								/>
							</div>
							{(activeAfter || activeBefore) && (
								<Button
									small
									minimal
									icon="cross"
									text="Clear"
									onClick={() => {
										setActivePreset(null);
										setActiveAfter(undefined);
										setActiveBefore(undefined);
									}}
								/>
							)}
						</div>
					}
				>
					<Button small minimal icon="time" active={!!(activeAfter || activeBefore)}>
						Active
						{activePreset
							? `: ${datePresets.find((p) => p.days === activePreset)?.label}`
							: activeAfter || activeBefore
								? ' (custom)'
								: ''}
					</Button>
				</Popover>
				<Popover
					aria-label="Filter by activity count"
					placement="bottom-start"
					content={
						<div className="popover-panel">
							<div className="popover-panel-title">Activity count</div>
							<div className="popover-range-row">
								<input
									type="number"
									min="0"
									placeholder="min"
									value={minActivitiesInput}
									onChange={(e) => setMinActivitiesInput(e.target.value)}
								/>
								<span className="popover-date-sep">to</span>
								<input
									type="number"
									min="0"
									placeholder="max"
									value={maxActivitiesInput}
									onChange={(e) => setMaxActivitiesInput(e.target.value)}
								/>
							</div>
							{(minActivitiesInput || maxActivitiesInput) && (
								<Button
									small
									minimal
									icon="cross"
									text="Clear"
									onClick={() => {
										setMinActivitiesInput('');
										setMaxActivitiesInput('');
									}}
								/>
							)}
						</div>
					}
				>
					<Button
						small
						minimal
						icon="pulse"
						active={!!(minActivities != null || maxActivities != null)}
					>
						Activities
						{minActivities != null || maxActivities != null
							? `: ${minActivities ?? '0'}${maxActivities != null ? `\u2013${maxActivities}` : '+'}`
							: ''}
					</Button>
				</Popover>
				<Popover
					aria-label="Filter by detection reason"
					placement="bottom-start"
					content={
						<div className="popover-panel">
							<div className="popover-panel-title">Detection reason</div>
							{spamFieldOptions.map((opt) => (
								<Checkbox
									key={opt.key}
									checked={spamFieldsFilter.includes(opt.key)}
									onChange={() => toggleSpamField(opt.key)}
									label={opt.label}
									style={{ marginBottom: 0 }}
								/>
							))}
							{spamFieldsFilter.length > 0 && (
								<Button
									small
									minimal
									icon="cross"
									text="Clear"
									onClick={() => setSpamFieldsFilter([])}
								/>
							)}
						</div>
					}
				>
					<Button small minimal icon="filter" active={spamFieldsFilter.length > 0}>
						Reason
						{spamFieldsFilter.length > 0 ? ` (${spamFieldsFilter.length})` : ''}
					</Button>
				</Popover>
			</div>
			<div className="users">
				{users.map((user) => (
					<UserSpamEntry
						user={user}
						key={user.id}
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
