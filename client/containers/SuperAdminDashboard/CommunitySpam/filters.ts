import type { OverviewSearchFilter } from 'client/containers/DashboardOverview/helpers/filters';
import type { SpamCommunityQuery } from 'types';

import { indexById } from 'utils/arrays';

export type SpamCommunitiesFilter = OverviewSearchFilter<
	Pick<SpamCommunityQuery, 'status' | 'ordering' | 'approvalRequested'>
>;

export const filters: SpamCommunitiesFilter[] = [
	{
		title: '👀 Unreviewed',
		id: 'unreviewed',
		query: {
			ordering: { field: 'spam-score', direction: 'DESC' },
			status: ['unreviewed'],
		},
	},
	{
		title: '📋 Approval requested',
		id: 'review-requested',
		query: {
			ordering: { field: 'approval-requested-at', direction: 'ASC' },
			status: ['unreviewed'],
			approvalRequested: true,
		},
	},
	{
		title: '✨ Recently created',
		id: 'recent',
		query: {
			ordering: { field: 'community-created-at', direction: 'DESC' },
			status: ['unreviewed', 'confirmed-not-spam', 'confirmed-spam'],
		},
	},
	{
		title: '❌ Confirmed spam',
		id: 'spam',
		query: {
			ordering: { field: 'spam-status-updated-at', direction: 'DESC' },
			status: ['confirmed-spam'],
		},
	},
	{
		title: '✅ Confirmed not spam',
		id: 'not-spam',
		query: {
			ordering: { field: 'spam-status-updated-at', direction: 'DESC' },
			status: ['confirmed-not-spam'],
		},
	},
];

export const filtersById = indexById(filters);
