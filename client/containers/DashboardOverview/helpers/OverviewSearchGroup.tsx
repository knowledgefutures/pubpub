import React, { useState, useCallback } from 'react';
import classNames from 'classnames';
import { Tab, Tabs } from '@blueprintjs/core';

import { Icon } from 'components';
import { PubsQuery } from 'types';

require('./overviewSearchGroup.scss');

type SearchTermCallback = (q: string) => unknown;

export type OverviewSearchFilter = {
	id: string;
	title: string;
	query: null | Partial<PubsQuery>;
};

type Props = {
	placeholder: string;
	onUpdateSearchTerm?: SearchTermCallback;
	onCommitSearchTerm?: SearchTermCallback;
	onChooseFilter?: (q: OverviewSearchFilter) => unknown;
	rightControls?: React.ReactNode;
	filters?: OverviewSearchFilter[];
	filter?: OverviewSearchFilter;
};

const defaultFilters: OverviewSearchFilter[] = [
	{ id: 'all', title: 'All', query: null },
	{
		id: 'latest',
		title: 'Latest',
		query: { ordering: { field: 'creationDate', direction: 'DESC' } },
	},
	{ id: 'drafts', title: 'Drafts', query: { isReleased: false } },
	{ id: 'released', title: 'Released', query: { isReleased: true } },
];

const OverviewSearchGroup = (props: Props) => {
	const {
		placeholder,
		onCommitSearchTerm,
		onUpdateSearchTerm,
		rightControls,
		onChooseFilter,
		filter,
		filters = defaultFilters,
	} = props;
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { value } = e.target as HTMLInputElement;
			if (onUpdateSearchTerm) {
				onUpdateSearchTerm(value.trim());
			}
		},
		[onUpdateSearchTerm],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			const { value } = e.target as HTMLInputElement;
			if (e.key === 'Enter' && onCommitSearchTerm) {
				onCommitSearchTerm(value.trim());
			}
		},
		[onCommitSearchTerm],
	);

	const handleFilterChange = useCallback(
		(filterId: string) => {
			if (onChooseFilter) {
				const nextFilter = filters.find((f) => f.id === filterId)!;
				onChooseFilter(nextFilter);
			}
		},
		[filters, onChooseFilter],
	);

	const controlledTabsProps: Partial<React.ComponentProps<typeof Tabs>> = {
		...(filter && { selectedTabId: filter.id }),
	};

	return (
		<div className="overview-search-group-component">
			{onChooseFilter && (
				<Tabs
					className="filter-controls"
					id="overview-search-group-filter"
					onChange={handleFilterChange}
					{...controlledTabsProps}
				>
					{filters.map((f) => (
						<Tab id={f.id} key={f.id} title={f.title} />
					))}
				</Tabs>
			)}
			<div className={classNames('search-bar', isSearchFocused && 'search-focused')}>
				<Icon icon="search" className="search-icon" iconSize={16} />
				<input
					placeholder={placeholder}
					onFocus={() => setIsSearchFocused(true)}
					onBlur={() => setIsSearchFocused(false)}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
				/>
				{rightControls && <div className="right-controls">{rightControls}</div>}
			</div>
		</div>
	);
};

export default OverviewSearchGroup;
