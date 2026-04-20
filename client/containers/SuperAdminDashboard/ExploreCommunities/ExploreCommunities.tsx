import React, { useCallback, useMemo, useState } from 'react';

import { Spinner, Switch } from '@blueprintjs/core';

import './exploreCommunities.scss';

type Community = {
	id: string;
	subdomain: string;
	domain: string | null;
	title: string;
	description: string | null;
	heroLogo: string | null;
	accentColorDark: string;
	isFeatured: boolean | null;
	activityScore: number;
	yearlyPageviews: number;
	cleanDiscussions: number;
	createdAt: string;
	updatedAt: string;
	scopeSummary?: {
		pubs: number;
		collections: number;
		discussions: number;
		reviews: number;
		submissions: number;
	};
};

type Props = {
	communities?: Community[];
};

type SortField =
	| 'activityScore'
	| 'title'
	| 'pubs'
	| 'discussions'
	| 'yearlyPageviews'
	| 'updatedAt';
type SortDir = 'asc' | 'desc';

const formatNumber = (n: number) => {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
};

const SkeletonRow = () => (
	<tr className="skeleton-row">
		<td className="col-featured">
			<div className="skeleton-block" style={{ width: 36, height: 20 }} />
		</td>
		<td className="col-title">
			<div className="community-info">
				<div
					className="skeleton-block"
					style={{ width: 8, height: 8, borderRadius: '50%' }}
				/>
				<div className="community-text">
					<div className="skeleton-block" style={{ width: 160, height: 14 }} />
					<div
						className="skeleton-block"
						style={{ width: 120, height: 11, marginTop: 4 }}
					/>
				</div>
			</div>
		</td>
		<td className="col-pubs">
			<div className="skeleton-block" style={{ width: 28, height: 14, marginLeft: 'auto' }} />
		</td>
		<td className="col-discussions">
			<div className="skeleton-block" style={{ width: 28, height: 14, marginLeft: 'auto' }} />
		</td>
		<td className="col-pageviews">
			<div className="skeleton-block" style={{ width: 40, height: 14, marginLeft: 'auto' }} />
		</td>
		<td className="col-activity">
			<div className="skeleton-block" style={{ width: 32, height: 14, marginLeft: 'auto' }} />
		</td>
		<td className="col-updated">
			<div className="skeleton-block" style={{ width: 64, height: 14, marginLeft: 'auto' }} />
		</td>
	</tr>
);

const SkeletonTable = () => (
	<div className="explore-communities-admin">
		<div className="admin-stats">
			{[0, 1, 2].map((i) => (
				<div className="stat" key={i}>
					<div className="skeleton-block" style={{ width: 48, height: 28 }} />
					<div
						className="skeleton-block"
						style={{ width: 100, height: 11, marginTop: 6 }}
					/>
				</div>
			))}
		</div>
		<div className="admin-controls">
			<div className="skeleton-block" style={{ flex: 1, minWidth: 200, height: 32 }} />
			<div className="skeleton-block" style={{ width: 140, height: 32 }} />
		</div>
		<div className="skeleton-block" style={{ width: 140, height: 12, marginBottom: 8 }} />
		<table className="admin-community-table">
			<thead>
				<tr>
					<th className="col-featured">Featured</th>
					<th className="col-title">Community</th>
					<th className="col-pubs">Pubs</th>
					<th className="col-discussions">Disc.</th>
					<th className="col-pageviews">Views (1yr)</th>
					<th className="col-activity">Activity</th>
					<th className="col-updated">Updated</th>
				</tr>
			</thead>
			<tbody>
				{Array.from({ length: 12 }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows never reorder
					<SkeletonRow key={i} />
				))}
			</tbody>
		</table>
	</div>
);

const ExploreCommunities = (props: Props) => {
	if (!props.communities) {
		return <SkeletonTable />;
	}
	return <ExploreCommunitiesInner communities={props.communities} />;
};

const ExploreCommunitiesInner = ({
	communities: initialCommunities,
}: {
	communities: Community[];
}) => {
	const [communities, setCommunities] = useState<Community[]>(initialCommunities);
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilter, setShowFilter] = useState<'all' | 'featured' | 'not-featured'>('all');
	const [sortField, setSortField] = useState<SortField>('activityScore');
	const [sortDir, setSortDir] = useState<SortDir>('desc');
	const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

	const featuredCount = useMemo(
		() => communities.filter((c) => c.isFeatured).length,
		[communities],
	);
	const totalCount = communities.length;

	const sorted = useMemo(() => {
		let filtered = communities;

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(c) =>
					c.title.toLowerCase().includes(term) ||
					c.subdomain.toLowerCase().includes(term) ||
					(c.description && c.description.toLowerCase().includes(term)),
			);
		}

		if (showFilter === 'featured') {
			filtered = filtered.filter((c) => c.isFeatured);
		} else if (showFilter === 'not-featured') {
			filtered = filtered.filter((c) => !c.isFeatured);
		}

		return [...filtered].sort((a, b) => {
			const dir = sortDir === 'asc' ? 1 : -1;
			if (sortField === 'title') return dir * a.title.localeCompare(b.title);
			if (sortField === 'pubs') {
				return dir * ((a.scopeSummary?.pubs || 0) - (b.scopeSummary?.pubs || 0));
			}
			if (sortField === 'discussions') {
				return dir * ((a.cleanDiscussions || 0) - (b.cleanDiscussions || 0));
			}
			if (sortField === 'yearlyPageviews') {
				return dir * ((a.yearlyPageviews || 0) - (b.yearlyPageviews || 0));
			}
			if (sortField === 'updatedAt') {
				return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
			}
			return dir * (a.activityScore - b.activityScore);
		});
	}, [communities, searchTerm, showFilter, sortField, sortDir]);

	const handleToggleFeatured = useCallback(async (communityId: string, newValue: boolean) => {
		setUpdatingIds((prev) => new Set(prev).add(communityId));
		try {
			const response = await fetch('/api/exploreFeatured', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ communityId, isFeatured: newValue }),
			});
			if (response.ok) {
				setCommunities((prev) =>
					prev.map((c) => (c.id === communityId ? { ...c, isFeatured: newValue } : c)),
				);
			}
		} finally {
			setUpdatingIds((prev) => {
				const next = new Set(prev);
				next.delete(communityId);
				return next;
			});
		}
	}, []);

	const getCommunityUrl = (c: Community) =>
		c.domain ? `https://${c.domain}` : `https://${c.subdomain}.pubpub.org`;

	const handleSort = useCallback(
		(field: SortField) => {
			if (sortField === field) {
				setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
			} else {
				setSortField(field);
				setSortDir(field === 'title' ? 'asc' : 'desc');
			}
		},
		[sortField],
	);

	const sortIcon = (field: SortField) => {
		if (sortField !== field) return ' ↕';
		return sortDir === 'desc' ? ' ↓' : ' ↑';
	};

	return (
		<div className="explore-communities-admin">
			{/* Summary stats */}
			<div className="admin-stats">
				<div className="stat">
					<span className="stat-number">{totalCount}</span>
					<span className="stat-label">Non-spam communities</span>
				</div>
				<div className="stat">
					<span className="stat-number">{featuredCount}</span>
					<span className="stat-label">Featured on Explore</span>
				</div>
				<div className="stat">
					<span className="stat-number">{totalCount - featuredCount}</span>
					<span className="stat-label">Not featured</span>
				</div>
			</div>

			{/* Controls */}
			<div className="admin-controls">
				<input
					type="text"
					className="admin-search"
					placeholder="Search communities..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<div className="admin-filters">
					<select
						value={showFilter}
						onChange={(e) =>
							setShowFilter(e.target.value as 'all' | 'featured' | 'not-featured')
						}
					>
						<option value="all">All ({totalCount})</option>
						<option value="featured">Featured ({featuredCount})</option>
						<option value="not-featured">
							Not featured ({totalCount - featuredCount})
						</option>
					</select>
				</div>
			</div>

			<div className="admin-result-count">
				Showing {sorted.length} communit{sorted.length === 1 ? 'y' : 'ies'}
			</div>

			{/* Table */}
			<table className="admin-community-table">
				<thead>
					<tr>
						<th className="col-featured">Featured</th>
						<th className="col-title sortable" onClick={() => handleSort('title')}>
							Community{sortIcon('title')}
						</th>
						<th className="col-pubs sortable" onClick={() => handleSort('pubs')}>
							Pubs{sortIcon('pubs')}
						</th>
						<th
							className="col-discussions sortable"
							onClick={() => handleSort('discussions')}
						>
							Disc.{sortIcon('discussions')}
						</th>
						<th
							className="col-pageviews sortable"
							onClick={() => handleSort('yearlyPageviews')}
						>
							Views (1yr){sortIcon('yearlyPageviews')}
						</th>
						<th
							className="col-activity sortable"
							onClick={() => handleSort('activityScore')}
						>
							Activity{sortIcon('activityScore')}
						</th>
						<th
							className="col-updated sortable"
							onClick={() => handleSort('updatedAt')}
						>
							Updated{sortIcon('updatedAt')}
						</th>
					</tr>
				</thead>
				<tbody>
					{sorted.map((c) => {
						const isUpdating = updatingIds.has(c.id);
						return (
							<tr key={c.id} className={c.isFeatured ? 'is-featured' : ''}>
								<td className="col-featured">
									{isUpdating ? (
										<Spinner size={16} />
									) : (
										<Switch
											checked={!!c.isFeatured}
											onChange={() =>
												handleToggleFeatured(c.id, !c.isFeatured)
											}
											innerLabel="off"
											innerLabelChecked="on"
										/>
									)}
								</td>
								<td className="col-title">
									<div className="community-info">
										<span
											className="accent-dot"
											style={{
												backgroundColor: c.accentColorDark || '#2c3654',
											}}
										/>
										<div className="community-text">
											<a
												className="community-name"
												href={getCommunityUrl(c)}
												target="_blank"
												rel="noopener noreferrer"
											>
												{c.title}
											</a>
											<span className="community-subdomain">
												{c.subdomain}.pubpub.org
											</span>
										</div>
									</div>
								</td>
								<td className="col-pubs">{c.scopeSummary?.pubs || 0}</td>
								<td className="col-discussions">{c.cleanDiscussions || 0}</td>
								<td className="col-pageviews">
									{formatNumber(c.yearlyPageviews || 0)}
								</td>
								<td className="col-activity">{c.activityScore}</td>
								<td className="col-updated">
									{new Date(c.updatedAt).toLocaleDateString()}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export default ExploreCommunities;
