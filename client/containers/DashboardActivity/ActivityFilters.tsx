import React from 'react';
import classNames from 'classnames';
import { Checkbox } from 'reakit/Checkbox';

import { ActivityFilter, ScopeId } from 'types';
import { Icon, IconName } from 'components';

require('./activityFilters.scss');

type Props = {
	activeFilters: ActivityFilter[];
	onUpdateActiveFilters: (nextFilters: ActivityFilter[]) => unknown;
	scope: ScopeId;
};

type FilterLabel = {
	label: string;
	icon: IconName;
};

const filterLabels: Record<ActivityFilter, FilterLabel> = {
	community: { label: 'Community', icon: 'office' },
	collection: { label: 'Collections', icon: 'collection' },
	pub: { label: 'Pubs', icon: 'pubDoc' },
	page: { label: 'Pages', icon: 'page-layout' },
	member: { label: 'Members', icon: 'people' },
	review: { label: 'Reviews', icon: 'social-media' },
	discussion: { label: 'Discussions', icon: 'chat' },
	pubEdge: { label: 'Connections', icon: 'layout-auto' },
	submission: { label: 'Submissions', icon: 'manually-entered-data' },
};

const allFilters = Object.keys(filterLabels) as ActivityFilter[];
const sortedFilters = (filters: ActivityFilter[]) =>
	filters.concat().sort((a, b) => allFilters.indexOf(a) - allFilters.indexOf(b));

const filtersByScopeKind = {
	community: sortedFilters([
		'community',
		'collection',
		'pub',
		'page',
		'member',
		'review',
		'discussion',
		'submission',
	]),
	collection: sortedFilters(['pub', 'member', 'review', 'discussion', 'submission']),
	pub: sortedFilters(['member', 'review', 'discussion', 'pubEdge', 'submission']),
};

const getFiltersForScope = (scope: ScopeId) => {
	if ('pubId' in scope && scope.pubId) {
		return filtersByScopeKind.pub;
	}
	if ('collectionId' in scope && scope.collectionId) {
		return filtersByScopeKind.collection;
	}
	return filtersByScopeKind.community;
};

const toggleFilterInclusion = (currentFilters: ActivityFilter[], toggleFilter: ActivityFilter) => {
	if (currentFilters.includes(toggleFilter)) {
		return currentFilters.filter((filter) => filter !== toggleFilter);
	}
	return [...currentFilters, toggleFilter];
};

const ActivityFilters = (props: Props) => {
	const { activeFilters, onUpdateActiveFilters, scope } = props;

	return (
		<div
			className={classNames(
				'activity-filters-component',
				activeFilters.length > 0 && 'some-filters-active',
			)}
		>
			<div className="label">Filter by</div>
			{getFiltersForScope(scope).map((filter) => {
				const { label, icon } = filterLabels[filter];
				return (
					<Checkbox
						key={filter}
						as="div"
						className="activity-filter"
						checked={activeFilters.includes(filter)}
						onChange={() =>
							onUpdateActiveFilters(toggleFilterInclusion(activeFilters, filter))
						}
					>
						<Icon icon={icon} iconSize={12} />
						{label}
					</Checkbox>
				);
			})}
		</div>
	);
};

export default ActivityFilters;
