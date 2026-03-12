import type { OverviewSearchFilter } from 'client/containers/DashboardOverview/helpers/filters';
import type { SpamUserQuery } from 'types';

import { indexById } from 'utils/arrays';

export type SpamUsersFilter = OverviewSearchFilter<
	Pick<SpamUserQuery, 'status' | 'ordering' | 'spamTagPresence' | 'hasCommunityBan'>
>;

export const filters: SpamUsersFilter[] = [
	{
		title: 'All',
		id: 'all',
		query: {
			ordering: { field: 'user-created-at', direction: 'DESC' },
			status: null,
		},
	},
	{
		title: 'Banned',
		id: 'banned',
		query: {
			ordering: { field: 'user-created-at', direction: 'DESC' },
			status: null,
			hasCommunityBan: true,
		},
	},
	{
		title: 'No spam tag',
		id: 'no-tag',
		query: {
			ordering: { field: 'user-created-at', direction: 'DESC' },
			status: null,
			spamTagPresence: 'absent',
		},
	},
	{
		title: 'Unreviewed',
		id: 'unreviewed',
		query: {
			ordering: { field: 'spam-score', direction: 'DESC' },
			status: ['unreviewed'],
		},
	},
	{
		title: 'Confirmed spam',
		id: 'spam',
		query: {
			ordering: { field: 'spam-status-updated-at', direction: 'DESC' },
			status: ['confirmed-spam'],
		},
	},
	{
		title: 'Confirmed not spam',
		id: 'not-spam',
		query: {
			ordering: { field: 'spam-status-updated-at', direction: 'DESC' },
			status: ['confirmed-not-spam'],
		},
	},
];

export const filtersById = indexById(filters);
