import React, { useMemo, useState } from 'react';
import { Button, NonIdealState, Spinner, Switch } from '@blueprintjs/core';

import { ActivityFilter, Member } from 'types';
import { usePageContext } from 'utils/hooks';
import { DashboardFrame } from 'client/components';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';
import * as api from 'client/utils/members/api';
import { checkMemberPermission } from 'utils/permissions';

import { useActivityItems } from './useActivityItems';
import { getBoundaryGroupsForSortedActivityItems } from './boundaries';
import ActivityFilters from './ActivityFilters';
import ActivityItemGroup from './ActivityItemGroup';

require('./dashboardActivity.scss');

type Props = {
	activityData: any;
};

const DashboardActivity = (props: Props) => {
	const { activityData } = props;
	const {
		scopeData,
		loginData: { id: userId },
		featureFlags,
	} = usePageContext();
	const { scope, memberData } = scopeData;
	const [member, setMember] = useState<Member | undefined>(
		memberData.find((m: Member) => m.communityId),
	);
	const [filters, setFilters] = useState<ActivityFilter[]>([]);

	const { items, loadMoreItems, isLoading, loadedAllItems } = useActivityItems({
		initialActivityData: activityData,
		scope,
		userId,
		filters,
	});

	const boundaryGroups = useMemo(() => getBoundaryGroupsForSortedActivityItems(items), [items]);

	const canSubscribeToActivityDigest =
		featureFlags.activityDigestSubscribeToggle &&
		member &&
		checkMemberPermission(member.permissions, 'manage') &&
		scopeData.elements.activeTargetType === 'community';
	const setEnrolledInActivityDigest = (subscribed: boolean): Promise<Member> =>
		api.updateMember({
			member,
			update: {
				subscribedToActivityDigest: subscribed,
			},
			scopeIds: { communityId: scope.communityId },
		});

	useInfiniteScroll({
		enabled: !isLoading && !loadedAllItems,
		useDocumentElement: true,
		onRequestMoreItems: loadMoreItems,
		scrollTolerance: 200,
	});

	return (
		<DashboardFrame
			className="dashboard-activity-container"
			title="Activity"
			controls={
				canSubscribeToActivityDigest && (
					<Switch
						checked={member.subscribedToActivityDigest}
						className="parent-approval-switch"
						onChange={(e) =>
							setEnrolledInActivityDigest(
								(e.target as HTMLInputElement).checked,
							).then(setMember)
						}
						label="Subscribe to daily Activity digest emails"
					/>
				)
			}
		>
			<ActivityFilters
				activeFilters={filters}
				onUpdateActiveFilters={setFilters}
				scope={scope}
			/>
			{items.length > 0 && (
				<div className="activity-items">
					{boundaryGroups.map((group) => (
						<ActivityItemGroup
							items={group.items}
							label={group.label}
							key={group.key}
						/>
					))}
				</div>
			)}
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
