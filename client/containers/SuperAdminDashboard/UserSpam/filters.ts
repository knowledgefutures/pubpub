import type { OverviewSearchFilter } from 'client/containers/DashboardOverview/helpers/filters';
import type { SpamUserQuery } from 'types';

import { indexById } from 'utils/arrays';

export type SpamUsersFilter = OverviewSearchFilter<Pick<SpamUserQuery, 'status' | 'ordering'>>;

export const filters: SpamUsersFilter[] = [
	{
		title: 'Unreviewed',
		id: 'unreviewed',
		query: {
			ordering: { field: 'spam-score', direction: 'DESC' },
			status: ['unreviewed'],
		},
	},
	{
		title: 'Recently created',
		id: 'recent',
		query: {
			ordering: { field: 'user-created-at', direction: 'DESC' },
			status: ['unreviewed', 'confirmed-not-spam', 'confirmed-spam'],
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
