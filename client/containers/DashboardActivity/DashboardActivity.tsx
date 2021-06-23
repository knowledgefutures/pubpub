import React, { useState } from 'react';
import { Button, NonIdealState, Spinner } from '@blueprintjs/core';

import { ActivityFilter } from 'types';
import { usePageContext } from 'utils/hooks';
import { DashboardFrame } from 'client/components';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';

import { useActivityItems } from './useActivityItems';
import ActivityItemRow from './ActivityItemRow';
import ActivityFilters from './ActivityFilters';

require('./dashboardActivity.scss');

type Props = {
	activityData: any;
};

const DashboardActivity = (props: Props) => {
	const { activityData } = props;
	const {
		scopeData: { scope },
		loginData: { id: userId },
	} = usePageContext();

	const [filters, setFilters] = useState<ActivityFilter[]>([]);

	const { items, loadMoreItems, isLoading, loadedAllItems } = useActivityItems({
		initialActivityData: activityData,
		scope,
		userId,
		filters,
	});

	useInfiniteScroll({
		enabled: !isLoading && !loadedAllItems,
		useDocumentElement: true,
		onRequestMoreItems: loadMoreItems,
		scrollTolerance: 200,
	});

	return (
		<DashboardFrame className="dashboard-activity-container" title="Activity">
			<ActivityFilters
				activeFilters={filters}
				onUpdateActiveFilters={setFilters}
				scope={scope}
			/>
			<div className="activity-items">
				{items.map((item) => (
					<ActivityItemRow item={item} key={item.id} />
				))}
			</div>
			{items.length === 0 && loadedAllItems && (
				<NonIdealState
					icon="clean"
					className="empty-state"
					title="No matching activity to show"
					action={
						<Button outlined onClick={() => setFilters([])}>
							Clear filters
						</Button>
					}
				/>
			)}
			{isLoading && (
				<div className="loading-indicator">
					<Spinner size={28} />
				</div>
			)}
		</DashboardFrame>
	);
};
export default DashboardActivity;
