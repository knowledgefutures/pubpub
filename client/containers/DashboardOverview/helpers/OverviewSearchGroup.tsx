import React, { useState, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { Tab, Tabs } from '@blueprintjs/core';

import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';

import { getDefaultOverviewSearchFilters, OverviewSearchFilter } from './filters';

require('./overviewSearchGroup.scss');

type SearchTermCallback = (q: string) => unknown;

type Props = {
	placeholder: string;
	onUpdateSearchTerm?: SearchTermCallback;
	onCommitSearchTerm?: SearchTermCallback;
	onChooseFilter?: (q: OverviewSearchFilter) => unknown;
	rightControls?: React.ReactNode;
	filters?: OverviewSearchFilter[];
	filter?: OverviewSearchFilter;
};

const OverviewSearchGroup = (props: Props) => {
	const {
		placeholder,
		onCommitSearchTerm,
		onUpdateSearchTerm,
		rightControls,
		onChooseFilter,
		filter,
		filters: providedFilters,
	} = props;
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const {
		loginData: { id: userId },
		scopeData: {
			activePermissions: { canView },
		},
	} = usePageContext();

	const filters = useMemo(() => {
		if (providedFilters) {
			return providedFilters;
		}
		return getDefaultOverviewSearchFilters({ userId, isViewMember: canView });
	}, [userId, canView, providedFilters]);

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

export { OverviewSearchFilter };
export default OverviewSearchGroup;
