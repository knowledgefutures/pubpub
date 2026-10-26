import type { OrgDataPayload } from 'server/org/dataQueries';
import type { MemberPermission } from 'types';

import type { ApplyTarget } from './BrandHelper';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Tooltip as BpTooltip,
	Button,
	ButtonGroup,
	Callout,
	FormGroup,
	HTMLSelect,
	InputGroup,
	Switch,
	Tab,
	Tabs,
	Tag,
	TextArea,
} from '@blueprintjs/core';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { apiFetch } from 'client/utils/apiFetch';
import { ColorInput, ImageUpload } from 'components';
import UserMenu from 'components/GlobalControls/UserMenu';
import { usePageContext } from 'utils/hooks';

import BrandHelper from './BrandHelper';
import OrgGraphTab from './OrgGraphTab';
import OrgTemplatesTab from './OrgTemplatesTab';

import './orgData.scss';

type Props = {
	orgData: OrgDataPayload;
};

/* ────────────────────── helpers ────────────────────── */

const fmtDate = (d: string | null) => {
	if (!d) return '—';
	return new Date(d).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const fmtMonth = (m: string) => {
	const [y, mo] = m.split('-');
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	return `${months[parseInt(mo, 10) - 1]} ${y}`;
};

const communityHref = (subdomain: string, domain: string | null) =>
	domain ? `https://${domain}` : `https://${subdomain}.pubpub.org`;

const pubHref = (pubSlug: string, subdomain: string, domain: string | null) =>
	`${communityHref(subdomain, domain)}/pub/${pubSlug}`;

/* ────────────────────── time range helpers ────────────────────── */
type QuickRange = '30d' | '90d' | '1yr' | '2yr';
type SortDir = 'asc' | 'desc';

const daysAgo = (n: number) => {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString().slice(0, 10);
};

const quickRangeDays: Record<QuickRange, number> = {
	'30d': 30,
	'90d': 90,
	'1yr': 365,
	'2yr': 730,
};

const quickRangeLabels: Record<QuickRange, string> = {
	'30d': '30 days',
	'90d': '90 days',
	'1yr': '1 year',
	'2yr': '2 years',
};

/* ────────────────────── skeleton loading table ────────────────────── */

const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
	<div className="data-table-wrapper">
		<table className="data-table skeleton-table">
			<thead>
				<tr>
					{Array.from({ length: cols }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
						<th key={i}>
							<div
								className="skeleton-line"
								style={{ width: i === 0 ? '60%' : '50%' }}
							/>
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{Array.from({ length: rows }, (_, r) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
					<tr key={r}>
						{Array.from({ length: cols }, (_, c) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
							<td key={c}>
								<div
									className="skeleton-line"
									style={{ width: `${45 + ((r + c) % 4) * 12}%` }}
								/>
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	</div>
);

/* ────────────────────── mini sparkline (inline SVG) ────────────────────── */

const MiniSparkline = ({
	data,
	color = '#137cbd',
	width = 100,
	height = 24,
}: {
	data: Array<{ views: number }>;
	color?: string;
	width?: number;
	height?: number;
}) => {
	if (!data.length) return null;
	const max = Math.max(...data.map((d) => d.views), 1);
	const points = data.map((d, i) => {
		const x = (i / Math.max(data.length - 1, 1)) * width;
		const y = height - (d.views / max) * (height - 2);
		return `${x},${y}`;
	});
	const polyline = points.join(' ');
	const areaPath = `M0,${height} L${points.map((p) => `${p}`).join(' L')} L${width},${height} Z`;
	return (
		<svg width={width} height={height} className="mini-sparkline">
			<path d={areaPath} fill={color} fillOpacity={0.15} />
			<polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} />
		</svg>
	);
};

/* ────────────────────── analytics scope badge ────────────────────── */

const AnalyticsScopeBadge = ({ scope }: { scope: OrgDataPayload['analyticsScope'] }) => {
	if (scope.totalCount === 0) return null;
	const label =
		scope.grantedCount === scope.totalCount
			? `All ${scope.totalCount} communities`
			: `${scope.grantedCount} of ${scope.totalCount} communities`;
	return (
		<BpTooltip
			content={
				scope.grantedCount === 0 ? (
					<span>No communities have granted analytics access</span>
				) : (
					<div style={{ maxWidth: 260 }}>
						<div style={{ fontWeight: 600, marginBottom: 4 }}>Analytics from:</div>
						{scope.grantedNames.map((n) => (
							<div key={n}>{n}</div>
						))}
					</div>
				)
			}
		>
			<Tag minimal round icon="eye-open" className="analytics-scope-tag">
				{label}
			</Tag>
		</BpTooltip>
	);
};

/* ────────────────────── sparkbar ────────────────────── */

const SparkBar = ({
	data,
	accentColor,
}: {
	data: Array<{ month: string; count: number }>;
	accentColor: string;
}) => {
	const max = Math.max(...data.map((d) => d.count), 1);
	return (
		<div className="spark-bar">
			{data.map((d) => (
				<div
					key={d.month}
					className="spark-bar-col"
					title={`${fmtMonth(d.month)}: ${d.count}`}
				>
					<div
						className="spark-bar-fill"
						style={{
							height: `${(d.count / max) * 100}%`,
							backgroundColor: accentColor,
						}}
					/>
					<span className="spark-bar-label">{fmtMonth(d.month).slice(0, 3)}</span>
				</div>
			))}
		</div>
	);
};

/* ────────────────────── stat card ────────────────────── */

const StatCard = ({
	label,
	value,
	sub,
	accent,
}: {
	label: string;
	value: string | number;
	sub?: string;
	accent?: string;
}) => (
	<div className="stat-card" style={accent ? { borderTopColor: accent } : undefined}>
		<div className="stat-card-value">
			{typeof value === 'number' ? value.toLocaleString() : value}
		</div>
		<div className="stat-card-label">
			{label}
			{sub && <span className="stat-card-sub">{sub}</span>}
		</div>
	</div>
);

/* ────────────────────── overview tab ────────────────────── */

/* ────────────────────── community breakdown sort ────────────────────── */
type BreakdownSortKey =
	| 'title'
	| 'pubs'
	| 'releases'
	| 'authors'
	| 'month'
	| 'views'
	| 'downloads'
	| 'latest';

const breakdownAccessors: Record<
	BreakdownSortKey,
	(c: OrgDataPayload['communityStats'][0]) => number | string
> = {
	title: (c) => c.title.toLowerCase(),
	pubs: (c) => c.pubCount,
	releases: (c) => c.releaseCount,
	authors: (c) => c.authorCount,
	month: (c) => c.recentPubCount,
	views: (c) => c.pageViews || 0,
	downloads: (c) => c.downloads || 0,
	latest: (c) => c.newestPub || '',
};

const OverviewTab = ({
	orgData,
	onRangeChange,
	activeRange,
	customStart,
	customEnd,
	onCustomStartChange,
	onCustomEndChange,
}: Props & {
	onRangeChange: (r: QuickRange) => void;
	activeRange: QuickRange | null;
	customStart: string;
	customEnd: string;
	onCustomStartChange: (v: string) => void;
	onCustomEndChange: (v: string) => void;
}) => {
	const { summary, pubsByMonth, communityStats, dailyViews, analyticsScope } = orgData;
	const accent = orgData.org.accentColorDark || '#2D2E2F';

	// Community breakdown sort
	const [bdSortKey, setBdSortKey] = useState<BreakdownSortKey>('pubs');
	const [bdSortDir, setBdSortDir] = useState<SortDir>('desc');
	const handleBdSort = (key: BreakdownSortKey) => {
		if (bdSortKey === key) {
			setBdSortDir(bdSortDir === 'desc' ? 'asc' : 'desc');
		} else {
			setBdSortKey(key);
			setBdSortDir(key === 'title' ? 'asc' : 'desc');
		}
	};
	const bdArrow = (key: BreakdownSortKey) => {
		if (bdSortKey !== key) return null;
		return <span className="sg-sort-arrow">{bdSortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
	};
	const sortedCommunities = useMemo(() => {
		const accessor = breakdownAccessors[bdSortKey];
		return [...communityStats].sort((a, b) => {
			const aVal = accessor(a);
			const bVal = accessor(b);
			const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
			return bdSortDir === 'asc' ? cmp : -cmp;
		});
	}, [communityStats, bdSortKey, bdSortDir]);

	// Format x-axis ticks sensibly
	const fmtXTick = (dateStr: string) => {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};

	// Determine tick interval based on data length
	const xTickInterval = useMemo(() => {
		const len = dailyViews?.length || 0;
		if (len <= 30) return 6; // ~every week
		if (len <= 90) return 13; // ~every 2 weeks
		if (len <= 365) return 29; // ~every month
		return 59; // ~every 2 months
	}, [dailyViews]);

	const hasAnalytics = analyticsScope && analyticsScope.grantedCount > 0;

	return (
		<div className="tab-overview">
			<div className="stat-grid">
				<StatCard label="Communities" value={summary.communityCount} accent={accent} />
				<StatCard label="Publications" value={summary.pubCount} accent={accent} />
				<StatCard label="Releases" value={summary.releaseCount} accent={accent} />
				<StatCard label="Collections" value={summary.collectionCount} accent={accent} />
				<StatCard label="Authors" value={summary.authorCount} accent={accent} />
				<StatCard label="Pubs This Year" value={summary.pubsThisYear} accent={accent} />
				{hasAnalytics && summary.totalPageViews > 0 && (
					<StatCard
						label="Page Views"
						value={summary.totalPageViews}
						sub="Last 2 years"
						accent={accent}
					/>
				)}
				{hasAnalytics && summary.totalDownloads > 0 && (
					<StatCard
						label="Downloads"
						value={summary.totalDownloads}
						sub="Last 2 years"
						accent={accent}
					/>
				)}
			</div>

			{hasAnalytics && (
				<div className="section">
					<div className="section-header">
						<h3 className="section-title">
							Page Views <AnalyticsScopeBadge scope={analyticsScope} />
						</h3>
						<div className="time-range-controls">
							<ButtonGroup>
								{(Object.keys(quickRangeLabels) as QuickRange[]).map((r) => (
									<Button
										key={r}
										small
										text={quickRangeLabels[r]}
										active={activeRange === r}
										onClick={() => onRangeChange(r)}
									/>
								))}
							</ButtonGroup>
							<span className="time-range-custom">
								<input
									type="date"
									value={customStart}
									onChange={(e) => onCustomStartChange(e.target.value)}
								/>
								<span className="time-range-dash">&ndash;</span>
								<input
									type="date"
									value={customEnd}
									onChange={(e) => onCustomEndChange(e.target.value)}
								/>
							</span>
						</div>
					</div>
					{dailyViews && dailyViews.length > 0 ? (
						<div className="daily-views-chart">
							<ResponsiveContainer width="100%" height={220}>
								<AreaChart
									data={dailyViews}
									margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
								>
									<defs>
										<linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
											<stop
												offset="5%"
												stopColor={accent}
												stopOpacity={0.3}
											/>
											<stop
												offset="95%"
												stopColor={accent}
												stopOpacity={0.02}
											/>
										</linearGradient>
									</defs>
									<XAxis
										dataKey="date"
										tickFormatter={fmtXTick}
										interval={xTickInterval}
										tick={{ fontSize: 11 }}
										axisLine={false}
										tickLine={false}
									/>
									<YAxis
										tickFormatter={(v: number) => v.toLocaleString()}
										tick={{ fontSize: 11 }}
										axisLine={false}
										tickLine={false}
										width={50}
									/>
									<Tooltip
										labelFormatter={(d: string) =>
											new Date(d).toLocaleDateString('en-US', {
												weekday: 'short',
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})
										}
										formatter={(v: number) => [v.toLocaleString(), 'Views']}
									/>
									<Area
										type="monotone"
										dataKey="views"
										stroke={accent}
										strokeWidth={2}
										fill="url(#viewsFill)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="section-empty">No view data for selected period.</div>
					)}
				</div>
			)}

			{pubsByMonth.length > 0 && (
				<div className="section">
					<h3 className="section-title">Publication Activity</h3>
					<SparkBar data={pubsByMonth} accentColor={accent} />
				</div>
			)}
			{pubsByMonth.length === 0 && (
				<div className="section">
					<h3 className="section-title">Publication Activity</h3>
					<div className="section-empty">No publications in selected period.</div>
				</div>
			)}

			<div className="section">
				<h3 className="section-title">Community Breakdown</h3>
				<div className="data-table-wrapper">
					<table className="data-table">
						<thead>
							<tr>
								<th className="sortable" onClick={() => handleBdSort('title')}>
									Community {bdArrow('title')}
								</th>
								<th className="num sortable" onClick={() => handleBdSort('pubs')}>
									Pubs {bdArrow('pubs')}
								</th>
								<th
									className="num sortable"
									onClick={() => handleBdSort('releases')}
								>
									Releases {bdArrow('releases')}
								</th>
								<th
									className="num sortable"
									onClick={() => handleBdSort('authors')}
								>
									Authors {bdArrow('authors')}
								</th>
								{hasAnalytics && (
									<th
										className="num sortable"
										onClick={() => handleBdSort('downloads')}
									>
										Downloads {bdArrow('downloads')}
									</th>
								)}
								{hasAnalytics && (
									<th
										className="num sortable"
										onClick={() => handleBdSort('views')}
									>
										Total Views {bdArrow('views')}
									</th>
								)}
								{hasAnalytics && <th className="sparkline-col">Views (90d)</th>}
								<th className="sortable" onClick={() => handleBdSort('latest')}>
									Latest Pub {bdArrow('latest')}
								</th>
							</tr>
						</thead>
						<tbody>
							{sortedCommunities.map((c) => (
								<tr key={c.id}>
									<td>
										<a
											href={communityHref(c.subdomain, c.domain)}
											target="_blank"
											rel="noopener noreferrer"
										>
											{c.title}
										</a>
									</td>
									<td className="num">{c.pubCount.toLocaleString()}</td>
									<td className="num">{c.releaseCount.toLocaleString()}</td>
									<td className="num">{c.authorCount.toLocaleString()}</td>
									{hasAnalytics && (
										<td className="num">
											{c.downloads ? c.downloads.toLocaleString() : '—'}
										</td>
									)}
									{hasAnalytics && (
										<td className="num">
											{c.pageViews ? c.pageViews.toLocaleString() : '—'}
										</td>
									)}
									{hasAnalytics && (
										<td className="sparkline-col">
											{c.sparkline?.length > 0 ? (
												<MiniSparkline
													data={c.sparkline}
													color={c.accentColorDark || accent}
												/>
											) : (
												<span className="no-access">—</span>
											)}
										</td>
									)}
									<td className="date">{fmtDate(c.newestPub)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

/* ────────────────────── publications tab ────────────────────── */

const PubsTab = ({ orgData }: Props) => {
	const [filter, setFilter] = useState('');
	const hasAnySparkline = orgData.recentPubs.some((p) => p.sparkline?.length > 0);
	const filtered = useMemo(() => {
		if (!filter.trim()) return orgData.recentPubs;
		const l = filter.toLowerCase();
		return orgData.recentPubs.filter(
			(p) =>
				p.title.toLowerCase().includes(l) ||
				p.communityTitle.toLowerCase().includes(l) ||
				p.authors.some((a) => a.name.toLowerCase().includes(l)),
		);
	}, [orgData.recentPubs, filter]);

	return (
		<div className="tab-pubs">
			<div className="tab-toolbar">
				<span className="tab-toolbar-count">{filtered.length} recent publications</span>
				<InputGroup
					className="tab-filter"
					leftIcon="search"
					placeholder="Filter by title, community, author..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
			</div>
			<div className="data-table-wrapper">
				<table className="data-table data-table-dense">
					<thead>
						<tr>
							<th>Title</th>
							<th>Authors</th>
							<th>Community</th>
							{hasAnySparkline && <th className="sparkline-col">Activity</th>}
							<th>Created</th>
							<th>Published</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((p) => (
							<tr key={p.id}>
								<td className="pub-title-cell">
									<a
										href={pubHref(
											p.slug,
											p.communitySubdomain,
											p.communityDomain,
										)}
										target="_blank"
										rel="noopener noreferrer"
									>
										{p.title}
									</a>
									{p.description && (
										<span className="pub-desc">{p.description}</span>
									)}
								</td>
								<td className="authors-cell">
									{p.authors.slice(0, 3).map((a) => (
										<span key={a.name} className="author-chip">
											{a.avatar ? (
												<img
													className="author-chip-avatar"
													src={a.avatar}
													alt=""
												/>
											) : (
												<span className="author-chip-initials">
													{a.name.charAt(0)}
												</span>
											)}
											{a.slug ? (
												<a
													href={`/user/${a.slug}`}
													className="author-chip-name"
												>
													{a.name}
												</a>
											) : (
												<span className="author-chip-name">{a.name}</span>
											)}
										</span>
									))}
									{p.authors.length > 3 && (
										<span className="author-more">+{p.authors.length - 3}</span>
									)}
								</td>
								<td>
									<a
										href={communityHref(
											p.communitySubdomain,
											p.communityDomain,
										)}
										target="_blank"
										rel="noopener noreferrer"
									>
										{p.communityTitle}
									</a>
								</td>
								{hasAnySparkline && (
									<td className="sparkline-cell">
										{p.sparkline?.length > 0 ? (
											<MiniSparkline
												data={p.sparkline.map((s) => ({ views: s.views }))}
												width={80}
												height={24}
												color="#5c7080"
											/>
										) : (
											<span style={{ opacity: 0.3 }}>—</span>
										)}
									</td>
								)}
								<td className="date">{fmtDate(p.createdAt)}</td>
								<td className="date">{fmtDate(p.customPublishedAt)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

/* ────────────────────── authors tab ────────────────────── */

const AuthorsTab = ({ orgData }: Props) => {
	const [filter, setFilter] = useState('');
	const filtered = useMemo(() => {
		if (!filter.trim()) return orgData.topAuthors;
		const l = filter.toLowerCase();
		return orgData.topAuthors.filter(
			(a) =>
				a.name.toLowerCase().includes(l) ||
				a.communities.some((c) => c.toLowerCase().includes(l)),
		);
	}, [orgData.topAuthors, filter]);

	return (
		<div className="tab-authors">
			<div className="tab-toolbar">
				<span className="tab-toolbar-count">{filtered.length} authors</span>
				<InputGroup
					className="tab-filter"
					leftIcon="search"
					placeholder="Filter by name or community..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
			</div>
			<div className="data-table-wrapper">
				<table className="data-table">
					<thead>
						<tr>
							<th>#</th>
							<th>Author</th>
							<th className="num">Publications</th>
							<th>Communities</th>
							<th>ORCID</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((a, i) => (
							<tr key={a.slug || a.name}>
								<td className="rank">{i + 1}</td>
								<td>
									<div className="author-cell">
										{a.avatar ? (
											<img
												className="author-cell-avatar"
												src={a.avatar}
												alt=""
											/>
										) : (
											<span className="author-cell-initials">
												{a.name.charAt(0)}
											</span>
										)}
										<div className="author-cell-info">
											{a.slug ? (
												<a
													href={`/user/${a.slug}`}
													className="author-cell-name"
												>
													{a.name}
												</a>
											) : (
												<span className="author-cell-name">{a.name}</span>
											)}
										</div>
									</div>
								</td>
								<td className="num">{a.pubCount}</td>
								<td>
									<div className="tag-list">
										{a.communities.map((c) => (
											<Tag key={c} minimal round className="community-tag">
												{c}
											</Tag>
										))}
									</div>
								</td>
								<td className="orcid">
									{a.orcid ? (
										<a
											href={`https://orcid.org/${a.orcid}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											{a.orcid}
										</a>
									) : (
										'—'
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

/* ────────────────────── communities tab ────────────────────── */

const CommunityCard = ({
	c,
	accent,
}: {
	c: OrgDataPayload['communityStats'][0];
	accent: string;
}) => {
	const [expanded, setExpanded] = useState(false);
	const [overflows, setOverflows] = useState(false);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = listRef.current;
		if (el) {
			setOverflows(el.scrollHeight > el.clientHeight + 2);
		}
	}, []);

	return (
		<div className="community-detail-card" key={c.id}>
			<div
				className="community-detail-accent"
				style={{ backgroundColor: c.accentColorDark || accent }}
			/>
			<div className="community-detail-header">
				<a
					className="community-detail-title"
					href={communityHref(c.subdomain, c.domain)}
					target="_blank"
					rel="noopener noreferrer"
				>
					{c.title}
				</a>
				{c.sparkline?.length > 0 && (
					<MiniSparkline
						data={c.sparkline}
						color={c.accentColorDark || accent}
						width={120}
						height={28}
					/>
				)}
			</div>
			<div className="community-detail-stats">
				<div className="cds">
					<span className="cds-val">{c.pubCount.toLocaleString()}</span>
					<span className="cds-label">Pubs</span>
				</div>
				<div className="cds">
					<span className="cds-val">{c.releaseCount.toLocaleString()}</span>
					<span className="cds-label">Releases</span>
				</div>
				<div className="cds">
					<span className="cds-val">{c.authorCount.toLocaleString()}</span>
					<span className="cds-label">Authors</span>
				</div>
				<div className="cds">
					<span className="cds-val">{c.collectionCount.toLocaleString()}</span>
					<span className="cds-label">Collections</span>
				</div>
				{c.pageViews > 0 && (
					<div className="cds">
						<span className="cds-val">{c.pageViews.toLocaleString()}</span>
						<span className="cds-label">Views (90d)</span>
					</div>
				)}
				{c.downloads > 0 && (
					<div className="cds">
						<span className="cds-val">{c.downloads.toLocaleString()}</span>
						<span className="cds-label">Downloads (90d)</span>
					</div>
				)}
			</div>
			<div className="community-detail-meta">
				<span>Latest pub: {fmtDate(c.newestPub)}</span>
				<span>Oldest pub: {fmtDate(c.oldestPub)}</span>
				<span>
					This month: <strong>{c.recentPubCount}</strong>
				</span>
			</div>
			{c.managers && c.managers.length > 0 && (
				<div className="community-detail-managers">
					<div
						ref={listRef}
						className={`community-manager-list${expanded ? ' expanded' : ''}`}
					>
						{c.managers.map((m) => (
							<div key={m.slug || m.name} className="community-manager-item">
								{m.avatar ? (
									<img
										className="community-manager-avatar"
										src={m.avatar}
										alt=""
									/>
								) : (
									<div className="community-manager-initials">
										{m.name.charAt(0)}
									</div>
								)}
								{m.slug ? (
									<a href={`/user/${m.slug}`}>{m.name}</a>
								) : (
									<span>{m.name}</span>
								)}
							</div>
						))}
					</div>
					{overflows && !expanded && (
						<div className="community-manager-show-more">
							<Button
								small
								minimal
								icon="more"
								text="Show more"
								onClick={() => setExpanded(true)}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

const CommunitiesTab = ({ orgData }: Props) => {
	const { communityStats } = orgData;
	const accent = orgData.org.accentColorDark || '#2D2E2F';
	return (
		<div className="tab-communities">
			<div className="community-cards">
				{communityStats.map((c) => (
					<CommunityCard key={c.id} c={c} accent={accent} />
				))}
			</div>
		</div>
	);
};

/* ────────────────────── collections tab ────────────────────── */

const CollectionsTab = ({ orgData }: Props) => {
	const kindLabels: Record<string, string> = {
		issue: 'Issue',
		book: 'Book',
		conference: 'Conference',
		tag: 'Tag',
	};
	return (
		<div className="tab-collections">
			<div className="data-table-wrapper">
				<table className="data-table">
					<thead>
						<tr>
							<th>#</th>
							<th>Collection</th>
							<th>Type</th>
							<th>Community</th>
							<th className="num">Pubs</th>
						</tr>
					</thead>
					<tbody>
						{orgData.topCollections.map((c, i) => (
							<tr key={c.id}>
								<td className="rank">{i + 1}</td>
								<td>{c.title}</td>
								<td>
									<Tag minimal>{kindLabels[c.kind] || c.kind}</Tag>
								</td>
								<td>{c.communityTitle}</td>
								<td className="num">{c.pubCount}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

/* ────────────────────── settings tab ────────────────────── */

type SettingsMember = {
	id: string;
	userId: string;
	permissions: MemberPermission;
	user: {
		id: string;
		fullName: string;
		slug: string;
		avatar: string | null;
		initials: string;
		email: string;
	} | null;
};

type KfAccounts = {
	current: string;
	accounts: { id: string; name: string; slug: string; type: 'personal' | 'shared' }[];
};

type PendingInvite = {
	id: string;
	community?: { id: string; title: string; subdomain: string };
	requestedBy?: { fullName: string };
};

type PendingInvites = { invites: PendingInvite[]; requests: PendingInvite[] };

const memberPermissionOptions = [
	{ value: 'view', label: 'View' },
	{ value: 'edit', label: 'Edit' },
	{ value: 'manage', label: 'Manage' },
	{ value: 'admin', label: 'Admin' },
];

type UserSearchResult = {
	id: string;
	slug: string;
	fullName: string;
	initials: string;
	avatar: string | null;
};
type CommunitySearchResult = {
	id: string;
	title: string;
	subdomain: string;
	domain: string | null;
	description: string | null;
	heroLogo: string | null;
	accentColorDark: string | null;
};

/* ── Inline user autocomplete ── */
const UserAutocomplete = ({
	onSelect,
	disabled,
}: {
	onSelect: (user: UserSearchResult) => void;
	disabled?: boolean;
}) => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<UserSearchResult[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleChange = (val: string) => {
		setQuery(val);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (val.trim().length < 2) {
			setResults([]);
			setShowDropdown(false);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			setLoading(true);
			try {
				const data = await apiFetch.get(
					`/api/search/users?q=${encodeURIComponent(val.trim())}`,
				);
				setResults(data as UserSearchResult[]);
				setShowDropdown(true);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 250);
	};

	const handleSelect = (user: UserSearchResult) => {
		onSelect(user);
		setQuery('');
		setResults([]);
		setShowDropdown(false);
	};

	return (
		<div className="user-autocomplete" ref={wrapperRef}>
			<InputGroup
				placeholder="Search by name, slug, or email..."
				value={query}
				onChange={(e) => handleChange(e.target.value)}
				onFocus={() => results.length > 0 && setShowDropdown(true)}
				leftIcon="search"
				small
				disabled={disabled}
				rightElement={loading ? <span className="ua-loading">...</span> : undefined}
			/>
			{showDropdown && results.length > 0 && (
				<div className="ua-dropdown">
					{results.map((u) => (
						<div
							key={u.id}
							className="ua-option"
							role="option"
							tabIndex={0}
							onClick={() => handleSelect(u)}
						>
							{u.avatar ? (
								<img className="ua-avatar" src={u.avatar} alt="" />
							) : (
								<span className="ua-initials">{u.initials}</span>
							)}
							<div className="ua-info">
								<span className="ua-name">{u.fullName}</span>
								<span className="ua-slug">@{u.slug}</span>
							</div>
						</div>
					))}
				</div>
			)}
			{showDropdown && results.length === 0 && query.trim().length >= 2 && !loading && (
				<div className="ua-dropdown">
					<div className="ua-empty">No users found</div>
				</div>
			)}
		</div>
	);
};

/* ── Inline community autocomplete ── */
const CommunityAutocomplete = ({
	onSelect,
	disabled,
}: {
	onSelect: (community: CommunitySearchResult) => void;
	disabled?: boolean;
}) => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<CommunitySearchResult[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleChange = (val: string) => {
		setQuery(val);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		// Extract subdomain from PubPub URLs
		let searchTerm = val.trim();
		try {
			const url = new URL(searchTerm);
			const subMatch = url.hostname.match(/^([^.]+)\.pubpub\.org$/);
			if (subMatch) searchTerm = subMatch[1];
		} catch {
			// not a URL, use as-is
		}
		if (searchTerm.length < 2) {
			setResults([]);
			setShowDropdown(false);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			setLoading(true);
			try {
				const data = await apiFetch.get(
					`/api/search/communities?q=${encodeURIComponent(searchTerm)}`,
				);
				setResults(data as CommunitySearchResult[]);
				setShowDropdown(true);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 250);
	};

	const handleSelect = (community: CommunitySearchResult) => {
		onSelect(community);
		setQuery('');
		setResults([]);
		setShowDropdown(false);
	};

	return (
		<div className="community-autocomplete" ref={wrapperRef}>
			<InputGroup
				placeholder="Search by name or subdomain..."
				value={query}
				onChange={(e) => handleChange(e.target.value)}
				onFocus={() => results.length > 0 && setShowDropdown(true)}
				leftIcon="search"
				small
				disabled={disabled}
				rightElement={loading ? <span className="ua-loading">...</span> : undefined}
			/>
			{showDropdown && results.length > 0 && (
				<div className="ca-dropdown">
					{results.map((c) => (
						<div
							key={c.id}
							className="ca-option"
							role="option"
							tabIndex={0}
							onClick={() => handleSelect(c)}
						>
							{c.heroLogo ? (
								<img className="ca-logo" src={c.heroLogo} alt="" />
							) : (
								<span
									className="ca-logo-placeholder"
									style={{ background: c.accentColorDark || '#394b59' }}
								>
									{c.title.charAt(0).toUpperCase()}
								</span>
							)}
							<div className="ca-info">
								<span className="ca-name">{c.title}</span>
								<span className="ca-subdomain">{c.subdomain}.pubpub.org</span>
								{c.description && (
									<span className="ca-desc">
										{c.description.slice(0, 80)}
										{c.description.length > 80 ? '…' : ''}
									</span>
								)}
							</div>
						</div>
					))}
				</div>
			)}
			{showDropdown && results.length === 0 && query.trim().length >= 2 && !loading && (
				<div className="ca-dropdown">
					<div className="ca-empty">No communities found</div>
				</div>
			)}
		</div>
	);
};

type PubSearchResult = {
	id: string;
	title: string;
	slug: string;
	communityTitle: string;
	communitySlug: string;
	communityDomain: string | null;
};

/** Extract a pub slug from a PubPub URL, e.g. https://xxx.pubpub.org/pub/my-slug */
const extractPubSlugFromUrl = (input: string): string | null => {
	try {
		const url = new URL(input.trim());
		const match = url.pathname.match(/^\/pub\/([^/]+)/);
		return match ? match[1] : null;
	} catch {
		return null;
	}
};

const PubAutocomplete = ({
	onSelect,
	disabled,
}: {
	onSelect: (pub: PubSearchResult) => void;
	disabled?: boolean;
}) => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<PubSearchResult[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleChange = (val: string) => {
		setQuery(val);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		const slug = extractPubSlugFromUrl(val);
		const searchTerm = slug || val.trim();
		if (searchTerm.length < 2) {
			setResults([]);
			setShowDropdown(false);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			setLoading(true);
			try {
				const data = (await apiFetch.get(
					`/api/search?q=${encodeURIComponent(searchTerm)}&mode=pubs&limit=10`,
				)) as any;
				setResults(data.results || []);
				setShowDropdown(true);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 250);
	};

	const handleSelect = (pub: PubSearchResult) => {
		onSelect(pub);
		setQuery('');
		setResults([]);
		setShowDropdown(false);
	};

	return (
		<div className="community-autocomplete" ref={wrapperRef}>
			<InputGroup
				placeholder="Search pubs by title or paste a PubPub URL..."
				value={query}
				onChange={(e) => handleChange(e.target.value)}
				onFocus={() => results.length > 0 && setShowDropdown(true)}
				leftIcon="search"
				small
				disabled={disabled}
				rightElement={loading ? <span className="ua-loading">...</span> : undefined}
			/>
			{showDropdown && results.length > 0 && (
				<div className="ca-dropdown">
					{results.map((p) => (
						<div
							key={p.id}
							className="ca-option"
							role="option"
							tabIndex={0}
							onClick={() => handleSelect(p)}
						>
							<div className="ca-info">
								<span className="ca-name">{p.title}</span>
								<span className="ca-subdomain">{p.communityTitle}</span>
							</div>
						</div>
					))}
				</div>
			)}
			{showDropdown && results.length === 0 && query.trim().length >= 2 && !loading && (
				<div className="ca-dropdown">
					<div className="ca-empty">No pubs found</div>
				</div>
			)}
		</div>
	);
};

const SettingsTab = ({ orgData }: Props) => {
	const org = orgData.org;
	const { loginData } = usePageContext();
	const _isSuperAdmin = loginData.isSuperAdmin;

	// Org info form
	const [title, setTitle] = useState(org.title || '');
	const [subtitle, setSubtitle] = useState(org.subtitle || '');
	const [description, setDescription] = useState(org.description || '');
	const [website, setWebsite] = useState(org.website || '');
	const [email, setEmail] = useState(org.email || '');
	const [avatar, setAvatar] = useState(org.avatar || '');
	const [heroImage, setHeroImage] = useState(org.heroImage || '');
	const [heroLogo, setHeroLogo] = useState(org.heroLogo || '');
	const [accentColorLight, setAccentColorLight] = useState(org.accentColorLight || '#FFFFFF');
	const [accentColorDark, setAccentColorDark] = useState(org.accentColorDark || '#2D2E2F');
	const [communityCreationEnabled, setCommunityCreationEnabled] = useState<boolean>(
		org.communityCreationEnabled ?? true,
	);
	const [communityCloneAccess, setCommunityCloneAccess] = useState<
		'off' | 'everyone' | 'managers'
	>(org.communityCloneAccess ?? 'off');
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [brandHelperOpen, setBrandHelperOpen] = useState(false);
	const [brandHelperDomain, setBrandHelperDomain] = useState('');

	// Members
	const [members, setMembers] = useState<SettingsMember[]>([]);
	const [newMemberPermissions, setNewMemberPermissions] = useState<MemberPermission>('view');
	const [memberLoading, setMemberLoading] = useState(false);
	const [memberError, setMemberError] = useState('');
	const [memberSaved, setMemberSaved] = useState(false);

	// KF Account
	const [kfAccounts, setKfAccounts] = useState<KfAccounts | null>(null);
	const [nextKfOrgId, setNextKfOrgId] = useState('');
	const [kfError, setKfError] = useState('');
	const [kfSaved, setKfSaved] = useState(false);

	// Communities
	const [communities, setCommunities] = useState<any[]>([]);
	const [communityLoading, setCommunityLoading] = useState(false);
	const [communityError, setCommunityError] = useState('');
	const [pendingInvites, setPendingInvites] = useState<PendingInvites>({
		invites: [],
		requests: [],
	});
	const [communitySaved, setCommunitySaved] = useState(false);

	// Curated Pubs
	const [curatedPubs, setCuratedPubs] = useState<any[]>([]);
	const [pubSaved, setPubSaved] = useState(false);
	const [pubError, setPubError] = useState('');

	// Domains (read-only for managers)

	const loadedRef = useRef(false);

	useEffect(() => {
		if (loadedRef.current) return;
		loadedRef.current = true;
		Promise.all([
			apiFetch.get(`/api/orgs/${org.id}/members`),
			apiFetch.get(`/api/orgs/${org.id}/communities`),
			apiFetch.get(`/api/orgs/${org.id}/pubs`),
			apiFetch.get(`/api/orgs/${org.id}/invites`),
		]).then(([mems, comms, pubs, pending]) => {
			setMembers(mems as any);
			setCommunities(comms as any);
			setCuratedPubs(pubs as any);
			setPendingInvites(pending as any);
		});
	}, [org.id]);

	const handleSaveInfo = async () => {
		setSaving(true);
		setSaved(false);
		try {
			await apiFetch.put(`/api/orgs/${org.id}`, {
				title,
				subtitle,
				description,
				website,
				email,
				avatar,
				heroImage,
				heroLogo,
				accentColorLight,
				accentColorDark,
				communityCreationEnabled,
				communityCloneAccess,
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} finally {
			setSaving(false);
		}
	};

	const flashMemberSaved = () => {
		setMemberSaved(true);
		setTimeout(() => setMemberSaved(false), 2000);
	};

	const loadKfAccounts = useCallback(async () => {
		const result = (await apiFetch.get(`/api/orgs/${org.id}/kf-accounts`)) as KfAccounts;
		setKfAccounts(result);
		setNextKfOrgId(result.current);
	}, [org.id]);

	useEffect(() => {
		loadKfAccounts().catch(() => setKfError('Could not load your KF Accounts'));
	}, [loadKfAccounts]);

	const handleSaveKfAccount = async () => {
		setKfError('');
		try {
			await apiFetch.put(`/api/orgs/${org.id}`, { kfOrgId: nextKfOrgId });
			await loadKfAccounts();
			setKfSaved(true);
			setTimeout(() => setKfSaved(false), 2000);
		} catch (e: any) {
			setKfError(e?.message || 'Failed to change the KF Account');
		}
	};

	const reloadMembers = async () => {
		const mems = await apiFetch.get(`/api/orgs/${org.id}/members`);
		setMembers(mems as any);
	};

	const handleAddMember = async (user: UserSearchResult) => {
		setMemberLoading(true);
		setMemberError('');
		try {
			await apiFetch.post(`/api/orgs/${org.id}/members`, {
				userId: user.id,
				permissions: newMemberPermissions,
			});
			await reloadMembers();
			flashMemberSaved();
		} catch (e: any) {
			setMemberError(e?.message || 'Failed to add member');
		} finally {
			setMemberLoading(false);
		}
	};

	const handleChangeMemberPermissions = async (userId: string, permissions: MemberPermission) => {
		setMemberError('');
		try {
			await apiFetch.post(`/api/orgs/${org.id}/members`, { userId, permissions });
			setMembers((prev) =>
				prev.map((m) => (m.userId === userId ? { ...m, permissions } : m)),
			);
			flashMemberSaved();
		} catch (e: any) {
			setMemberError(e?.message || 'Failed to change level');
		}
	};

	const handleRemoveMember = async (userId: string) => {
		setMemberError('');
		try {
			await apiFetch.delete(`/api/orgs/${org.id}/members/${userId}`);
			setMembers((prev) => prev.filter((m) => m.userId !== userId));
			flashMemberSaved();
		} catch (e: any) {
			setMemberError(e?.message || 'Failed to remove member');
		}
	};

	const flashCommunitySaved = () => {
		setCommunitySaved(true);
		setTimeout(() => setCommunitySaved(false), 2000);
	};

	const reloadCommunities = async () => {
		const [comms, pending] = await Promise.all([
			apiFetch.get(`/api/orgs/${org.id}/communities`),
			apiFetch.get(`/api/orgs/${org.id}/invites`),
		]);
		setCommunities(comms as any);
		setPendingInvites(pending as any);
	};

	/** Invites the community, or moves it in directly if the user also admins it */
	const handleInviteCommunity = async (community: CommunitySearchResult) => {
		setCommunityLoading(true);
		setCommunityError('');
		try {
			await apiFetch.post(`/api/orgs/${org.id}/invites`, {
				subdomain: community.subdomain,
			});
			await reloadCommunities();
			flashCommunitySaved();
		} catch (e: any) {
			setCommunityError(e?.message || 'Failed to invite community');
		} finally {
			setCommunityLoading(false);
		}
	};

	const handleInviteAction = async (
		inviteId: string,
		action: 'accept' | 'decline' | 'cancel',
	) => {
		setCommunityError('');
		try {
			await apiFetch.post(`/api/orgInvites/${inviteId}/${action}`, {});
			await reloadCommunities();
			flashCommunitySaved();
		} catch (e: any) {
			setCommunityError(e?.message || `Failed to ${action}`);
		}
	};

	const handleRemoveCommunity = async (communityId: string) => {
		try {
			await apiFetch.delete(`/api/orgs/${org.id}/communities/${communityId}`);
			setCommunities((prev) => prev.filter((c) => c.id !== communityId));
			flashCommunitySaved();
		} catch (e: any) {
			setCommunityError(e?.message || 'Failed to remove community');
		}
	};

	const flashPubSaved = () => {
		setPubSaved(true);
		setTimeout(() => setPubSaved(false), 2000);
	};

	const handleRemovePub = async (pubId: string) => {
		try {
			await apiFetch.delete(`/api/orgs/${org.id}/pubs/${pubId}`);
			setCuratedPubs((prev) => prev.filter((p) => p.pubId !== pubId));
			flashPubSaved();
		} catch (e: any) {
			setPubError(e?.message || 'Failed to remove pub');
		}
	};

	const handleAddPub = async (pub: PubSearchResult) => {
		try {
			setPubError('');
			await apiFetch.post(`/api/orgs/${org.id}/pubs`, { pubId: pub.id });
			const pubs = await apiFetch.get(`/api/orgs/${org.id}/pubs`);
			setCuratedPubs(pubs as any);
			flashPubSaved();
		} catch (e: any) {
			setPubError(e?.message || 'Failed to add pub');
		}
	};

	const handleBrandApply = useCallback((field: ApplyTarget, value: string) => {
		const setters: Record<ApplyTarget, (v: string) => void> = {
			title: setTitle,
			subtitle: setSubtitle,
			description: setDescription,
			avatar: setAvatar,
			heroImage: setHeroImage,
			heroLogo: setHeroLogo,
			accentColorLight: setAccentColorLight,
			accentColorDark: setAccentColorDark,
		};
		setters[field]?.(value);
	}, []);

	const openBrandHelper = useCallback((domain: string) => {
		setBrandHelperDomain(domain);
		setBrandHelperOpen(true);
	}, []);

	return (
		<div className="tab-settings">
			{/* ─── Org Info ─── */}
			<div className="settings-section">
				<div className="settings-section-header">
					<h3 className="settings-section-title">Org Info</h3>
					<Button
						small
						minimal
						icon="lifesaver"
						// text="Brand Helper"
						title="Import from site"
						onClick={() => openBrandHelper((org.domains || [])[0] || '')}
					/>
				</div>
				<div className="settings-form">
					<FormGroup label="Title" labelFor="s-title">
						<InputGroup
							id="s-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</FormGroup>
					<FormGroup label="Subtitle" labelFor="s-subtitle">
						<InputGroup
							id="s-subtitle"
							value={subtitle}
							onChange={(e) => setSubtitle(e.target.value)}
						/>
					</FormGroup>
					<FormGroup label="Description" labelFor="s-desc">
						<TextArea
							id="s-desc"
							fill
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
						/>
					</FormGroup>
					<div className="settings-row">
						<FormGroup label="Website" labelFor="s-website">
							<InputGroup
								id="s-website"
								value={website}
								onChange={(e) => setWebsite(e.target.value)}
								placeholder="https://..."
							/>
						</FormGroup>
						<FormGroup label="Contact Email" labelFor="s-email">
							<InputGroup
								id="s-email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</FormGroup>
					</div>
					<div className="settings-row settings-images-row">
						<ImageUpload
							key={avatar}
							htmlFor="s-avatar"
							label="Avatar / Logo (square)"
							defaultImage={avatar}
							height={80}
							width={80}
							canClear
							onNewImage={(val) => setAvatar(val)}
						/>
						<ImageUpload
							key={heroLogo}
							htmlFor="s-hero-logo"
							label="Hero Logo (wider)"
							defaultImage={heroLogo}
							height={60}
							width={200}
							canClear
							onNewImage={(val) => setHeroLogo(val)}
						/>
					</div>
					<div className="settings-row settings-images-row">
						<ImageUpload
							key={heroImage}
							htmlFor="s-hero-image"
							label="Hero Background Image"
							defaultImage={heroImage}
							height={100}
							width={300}
							canClear
							onNewImage={(val) => setHeroImage(val)}
						/>
					</div>
					<div className="settings-row">
						<FormGroup label="Accent Color (Light)">
							<ColorInput
								value={accentColorLight}
								onChange={(val) => setAccentColorLight(val.hex)}
							/>
						</FormGroup>
						<FormGroup label="Accent Color (Dark)">
							<ColorInput
								value={accentColorDark}
								onChange={(val) => setAccentColorDark(val.hex)}
							/>
						</FormGroup>
					</div>
					<div className="settings-row" style={{ marginBottom: 12 }}>
						<Switch
							checked={communityCreationEnabled}
							label='Show "Create Community" button on Org landing page'
							onChange={() => setCommunityCreationEnabled(!communityCreationEnabled)}
						/>
						<FormGroup
							label='"Clone from Community" option'
							style={{ marginBottom: 0, marginTop: 8 }}
							disabled={!communityCreationEnabled}
						>
							<HTMLSelect
								value={communityCloneAccess}
								onChange={(e) =>
									setCommunityCloneAccess(
										e.target.value as 'off' | 'everyone' | 'managers',
									)
								}
								disabled={!communityCreationEnabled}
							>
								<option value="off">Off</option>
								<option value="everyone">Everyone</option>
								<option value="managers">Org members only</option>
							</HTMLSelect>
						</FormGroup>
					</div>
					<div className="settings-save-row">
						<Button
							intent="primary"
							text={saving ? 'Saving...' : 'Save Changes'}
							onClick={handleSaveInfo}
							disabled={saving}
						/>
						{saved && <span className="settings-saved-msg">Saved!</span>}
					</div>
				</div>
			</div>

			{/* ─── KF Account ─── */}
			<div className="settings-section">
				<h3 className="settings-section-title">
					KF Account{kfSaved && <span className="settings-saved-msg">Saved!</span>}
				</h3>
				<p className="settings-help">
					The Knowledge Futures account this org bills to. You can move it to another KF
					Account you belong to.
				</p>
				{kfError && (
					<Callout intent="danger" className="settings-error">
						{kfError}
					</Callout>
				)}
				{kfAccounts && (
					<div className="settings-row">
						<HTMLSelect
							value={nextKfOrgId}
							onChange={(e) => setNextKfOrgId(e.target.value)}
							options={[
								...(kfAccounts.accounts.some((a) => a.id === kfAccounts.current)
									? []
									: [{ value: kfAccounts.current, label: kfAccounts.current }]),
								...kfAccounts.accounts.map((a) => ({
									value: a.id,
									label: a.type === 'personal' ? `${a.name} (personal)` : a.name,
								})),
							]}
						/>
						<Button
							text="Save"
							disabled={nextKfOrgId === kfAccounts.current}
							onClick={handleSaveKfAccount}
						/>
					</div>
				)}
			</div>

			{/* ─── Members ─── */}
			<div className="settings-section">
				<h3 className="settings-section-title">
					Members{memberSaved && <span className="settings-saved-msg">Saved!</span>}
				</h3>
				<p className="settings-help">
					Each member gets their level in every community this org owns. Admins also
					manage the org itself: its members, communities, featured pubs, templates and
					settings.
				</p>
				<div className="settings-row">
					<UserAutocomplete onSelect={handleAddMember} disabled={memberLoading} />
					<HTMLSelect
						value={newMemberPermissions}
						onChange={(e) =>
							setNewMemberPermissions(e.target.value as MemberPermission)
						}
						options={memberPermissionOptions}
					/>
				</div>
				{memberError && (
					<Callout intent="danger" className="settings-error">
						{memberError}
					</Callout>
				)}
				<div className="settings-list">
					{members.map((m) => (
						<div className="settings-list-item" key={m.userId}>
							<span className="settings-list-name">
								{m.user?.avatar ? (
									<img
										className="settings-list-avatar"
										src={m.user.avatar}
										alt=""
									/>
								) : (
									<span className="settings-list-initials">
										{m.user?.initials || '?'}
									</span>
								)}
								{m.user?.fullName || m.userId}
								{m.user?.slug && (
									<span className="settings-list-slug">@{m.user.slug}</span>
								)}
							</span>
							<span>
								<HTMLSelect
									minimal
									value={m.permissions}
									onChange={(e) =>
										handleChangeMemberPermissions(
											m.userId,
											e.target.value as MemberPermission,
										)
									}
									options={memberPermissionOptions}
								/>
								<Button
									small
									minimal
									intent="danger"
									icon="cross"
									onClick={() => handleRemoveMember(m.userId)}
								/>
							</span>
						</div>
					))}
					{members.length === 0 && (
						<div className="settings-empty">No members added yet.</div>
					)}
				</div>
			</div>

			{/* ─── Communities ─── */}
			<div className="settings-section">
				<h3 className="settings-section-title">
					Communities
					{communitySaved && <span className="settings-saved-msg">Saved!</span>}
				</h3>
				<p className="settings-help">
					Communities this org owns. Org members get their level in each of them, and the
					dashboard and analytics cover them. Inviting a community asks its admins to
					join; if you admin it too, it moves in right away.
				</p>
				<CommunityAutocomplete
					onSelect={handleInviteCommunity}
					disabled={communityLoading}
				/>
				{pendingInvites.requests.length > 0 && (
					<div className="settings-list">
						<div className="settings-list-heading">Asking to join</div>
						{pendingInvites.requests.map((r) => (
							<div className="settings-list-item" key={r.id}>
								<span className="settings-list-name">
									{r.community?.title}
									<span className="settings-list-slug">
										asked by {r.requestedBy?.fullName ?? 'a community admin'}
									</span>
								</span>
								<span>
									<Button
										small
										minimal
										intent="success"
										icon="tick"
										text="Accept"
										onClick={() => handleInviteAction(r.id, 'accept')}
									/>
									<Button
										small
										minimal
										icon="cross"
										text="Decline"
										onClick={() => handleInviteAction(r.id, 'decline')}
									/>
								</span>
							</div>
						))}
					</div>
				)}
				{pendingInvites.invites.length > 0 && (
					<div className="settings-list">
						<div className="settings-list-heading">Invited</div>
						{pendingInvites.invites.map((i) => (
							<div className="settings-list-item" key={i.id}>
								<span className="settings-list-name">
									{i.community?.title}
									<span className="settings-list-slug">
										waiting for a community admin
									</span>
								</span>
								<Button
									small
									minimal
									icon="cross"
									text="Cancel"
									onClick={() => handleInviteAction(i.id, 'cancel')}
								/>
							</div>
						))}
					</div>
				)}
				{communityError && (
					<Callout intent="danger" className="settings-error">
						{communityError}
					</Callout>
				)}
				<div className="settings-community-table">
					<table>
						<thead>
							<tr>
								<th>Community</th>
								<th className="col-actions" />
							</tr>
						</thead>
						<tbody>
							{communities.map((c) => (
								<tr key={c.id}>
									<td>
										<a
											href={
												c.domain
													? `https://${c.domain}`
													: `https://${c.subdomain}.pubpub.org`
											}
											target="_blank"
											rel="noopener noreferrer"
										>
											{c.title}
										</a>
										<span className="settings-list-slug">
											{c.subdomain}.pubpub.org
										</span>
									</td>
									<td className="col-actions">
										<Button
											small
											minimal
											intent="danger"
											icon="cross"
											onClick={() => handleRemoveCommunity(c.id)}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{communities.length === 0 && (
						<div className="settings-empty">
							This org doesn&rsquo;t own any communities yet.
						</div>
					)}
				</div>
			</div>

			{/* ─── Featured Pubs ─── */}
			<div className="settings-section">
				<h3 className="settings-section-title">
					Featured Pubs
					{pubSaved && <span className="settings-saved-msg">Saved!</span>}
				</h3>
				<p className="settings-help">
					Pubs from this org&rsquo;s communities to feature on its landing page. Use the
					Suggested Pubs tab to find them.
				</p>
				<PubAutocomplete onSelect={handleAddPub} />
				{pubError && (
					<Callout intent="danger" className="settings-error">
						{pubError}
					</Callout>
				)}
				<div className="settings-community-table">
					<table>
						<thead>
							<tr>
								<th>Pub</th>
								<th>Community</th>
								<th className="col-toggle">Landing Page</th>
								<th className="col-actions" />
							</tr>
						</thead>
						<tbody>
							{curatedPubs.map((cp) => (
								<tr key={cp.id}>
									<td>
										<a
											href={pubHref(
												cp.pub?.slug || '',
												cp.pub?.community?.subdomain || '',
												cp.pub?.community?.domain || null,
											)}
											target="_blank"
											rel="noopener noreferrer"
										>
											{cp.pub?.title || '(unknown)'}
										</a>
									</td>
									<td>
										{cp.pub?.community ? (
											<a
												href={communityHref(
													cp.pub.community.subdomain,
													cp.pub.community.domain || null,
												)}
												target="_blank"
												rel="noopener noreferrer"
											>
												{cp.pub.community.title}
											</a>
										) : (
											'\u2014'
										)}
									</td>
									<td className="col-toggle">
										<Switch
											checked={cp.showOnLandingPage !== false}
											onChange={async () => {
												const show = cp.showOnLandingPage === false;
												await apiFetch.put(
													`/api/orgs/${org.id}/pubs/${cp.pubId}`,
													{ showOnLandingPage: show },
												);
												setCuratedPubs((prev) =>
													prev.map((p) =>
														p.pubId === cp.pubId
															? { ...p, showOnLandingPage: show }
															: p,
													),
												);
												flashPubSaved();
											}}
											innerLabel="off"
											innerLabelChecked="on"
										/>
									</td>
									<td className="col-actions">
										<Button
											small
											minimal
											intent="danger"
											icon="cross"
											onClick={() => handleRemovePub(cp.pubId)}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{curatedPubs.length === 0 && (
						<div className="settings-empty">
							No featured pubs yet. Use the Suggested Pubs tab to find pubs from this
							org&rsquo;s communities.
						</div>
					)}
				</div>
			</div>

			{/* ─── Domains (read-only) ─── */}
			<div className="settings-section">
				<h3 className="settings-section-title">Email Domains</h3>
				<p className="settings-help">
					Email domains are managed by PubPub administrators and are used to discover
					suggested communities.
				</p>
				<div className="settings-tag-list">
					{(org.domains || []).map((d) => (
						<Tag key={d} large minimal round>
							{d}
						</Tag>
					))}
					{(org.domains || []).length === 0 && (
						<div className="settings-empty">No email domains configured.</div>
					)}
				</div>
			</div>

			{/* ─── Pub Search Terms (read-only) ─── */}
			<div className="settings-section">
				<h3 className="settings-section-title">Pub Search Terms</h3>
				<p className="settings-help">
					Pub search terms are managed by PubPub administrators and are used to discover
					suggested pubs via full-text search.
				</p>
				<div className="settings-tag-list">
					{(org.pubSearchTerms || []).map((t) => (
						<Tag key={t} large minimal round>
							{t}
						</Tag>
					))}
					{(org.pubSearchTerms || []).length === 0 && (
						<div className="settings-empty">No pub search terms configured.</div>
					)}
				</div>
			</div>

			<BrandHelper
				isOpen={brandHelperOpen}
				domain={brandHelperDomain}
				onClose={() => setBrandHelperOpen(false)}
				onApply={handleBrandApply}
			/>
		</div>
	);
};

/* ────────────────────── suggested communities tab ────────────────────── */

type SuggestedCommunity = {
	communityId: string;
	title: string;
	subdomain: string;
	domain: string | null;
	description: string | null;
	heroLogo: string | null;
	accentColorDark: string | null;
	accentColorLight: string | null;
	createdAt: string;
	pubCount: number;
	managerCount: number;
	authorCount: number;
	alreadyAdded: boolean;
	pendingDirection: 'invite' | 'request' | null;
};

type SuggestedSortKey = 'title' | 'managers' | 'authors' | 'pubs' | 'created' | 'status';

const suggestedSortAccessors: Record<SuggestedSortKey, (s: SuggestedCommunity) => number | string> =
	{
		title: (s) => s.title.toLowerCase(),
		managers: (s) => s.managerCount,
		authors: (s) => s.authorCount,
		pubs: (s) => s.pubCount,
		created: (s) => s.createdAt,
		status: (s) => (s.alreadyAdded ? 1 : 0),
	};

const SuggestedCommunitiesTab = ({ orgId }: { orgId: string }) => {
	const { loginData } = usePageContext();
	const [suggestions, setSuggestions] = useState<SuggestedCommunity[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [filter, setFilter] = useState('');
	const [sortKey, setSortKey] = useState<SuggestedSortKey>('authors');
	const [sortDir, setSortDir] = useState<SortDir>('desc');
	const fetchedRef = useRef(false);

	useEffect(() => {
		if (fetchedRef.current) return;
		fetchedRef.current = true;
		setLoading(true);
		apiFetch
			.get(`/api/orgs/${orgId}/suggested-communities`)
			.then((data) => setSuggestions(data as any))
			.catch(() => setSuggestions([]))
			.finally(() => setLoading(false));
	}, [orgId]);

	const handleInvite = useCallback(
		async (communityId: string) => {
			await apiFetch.post(`/api/orgs/${orgId}/invites`, { communityId });
			const data = await apiFetch.get(`/api/orgs/${orgId}/suggested-communities`);
			setSuggestions(data as any);
		},
		[orgId],
	);

	const handleRemove = useCallback(
		async (communityId: string) => {
			await apiFetch.delete(`/api/orgs/${orgId}/communities/${communityId}`);
			const data = await apiFetch.get(`/api/orgs/${orgId}/suggested-communities`);
			setSuggestions(data as any);
		},
		[orgId],
	);

	const handleSort = (key: SuggestedSortKey) => {
		if (sortKey === key) {
			setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
		} else {
			setSortKey(key);
			setSortDir(key === 'title' ? 'asc' : 'desc');
		}
	};

	const sortArrow = (key: SuggestedSortKey) => {
		if (sortKey !== key) return null;
		return <span className="sg-sort-arrow">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
	};

	const sorted = useMemo(() => {
		if (!suggestions) return [];
		let rows = suggestions;
		if (filter.trim()) {
			const l = filter.toLowerCase();
			rows = rows.filter(
				(s) =>
					s.title.toLowerCase().includes(l) ||
					s.subdomain.toLowerCase().includes(l) ||
					(s.description || '').toLowerCase().includes(l),
			);
		}
		const accessor = suggestedSortAccessors[sortKey];
		return [...rows].sort((a, b) => {
			const va = accessor(a);
			const vb = accessor(b);
			const cmp = va < vb ? -1 : va > vb ? 1 : 0;
			return sortDir === 'asc' ? cmp : -cmp;
		});
	}, [suggestions, filter, sortKey, sortDir]);

	if (loading || !suggestions) {
		return (
			<div className="tab-suggested">
				<SkeletonTable rows={5} cols={4} />
			</div>
		);
	}

	if (suggestions.length === 0) {
		return (
			<div className="tab-suggested">
				<div className="suggested-empty">
					No suggested communities found. Add email domains in the org settings to
					discover related communities.
				</div>
			</div>
		);
	}

	const addedCount = suggestions.filter((s) => s.alreadyAdded).length;

	return (
		<div className="tab-suggested">
			<div className="sg-summary-bar">
				<span className="sg-summary-stat">
					<strong>{suggestions.length}</strong> communities discovered
				</span>
				<span className="sg-summary-sep" />
				<span className="sg-summary-stat">
					<strong>{addedCount}</strong> owned
				</span>
				<span className="sg-summary-sep" />
				<span className="sg-summary-stat">
					<strong>{suggestions.length - addedCount}</strong> available
				</span>
				<InputGroup
					className="sg-filter"
					leftIcon="search"
					placeholder="Filter by name or subdomain..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					small
				/>
			</div>
			<div className="sg-help">
				Based on your org&rsquo;s email domains. Counts reflect only managers, authors, and
				pubs associated with users whose email matches your configured domains. Communities
				another org owns aren&rsquo;t listed. Inviting a community asks its admins to join;
				answer requests to join in Settings.
			</div>
			<div className="data-table-wrapper">
				<table className="data-table sg-table">
					<thead>
						<tr>
							<th className="sg-th sg-th-title" onClick={() => handleSort('title')}>
								Community {sortArrow('title')}
							</th>
							<th className="sg-th sg-th-num" onClick={() => handleSort('managers')}>
								Managers {sortArrow('managers')}
							</th>
							<th className="sg-th sg-th-num" onClick={() => handleSort('authors')}>
								Authors {sortArrow('authors')}
							</th>
							<th className="sg-th sg-th-num" onClick={() => handleSort('pubs')}>
								Pubs {sortArrow('pubs')}
							</th>
							<th className="sg-th sg-th-date" onClick={() => handleSort('created')}>
								Created {sortArrow('created')}
							</th>
							<th className="sg-th sg-th-status" onClick={() => handleSort('status')}>
								Status {sortArrow('status')}
							</th>
							<th className="sg-th sg-th-action" />
						</tr>
					</thead>
					<tbody>
						{sorted.map((s) => (
							<tr
								key={s.communityId}
								className={s.alreadyAdded ? 'sg-row-added' : ''}
							>
								<td className="sg-td-title">
									<a
										href={communityHref(s.subdomain, s.domain)}
										target="_blank"
										rel="noopener noreferrer"
										className="sg-community-link"
									>
										{s.title}
									</a>
									<span className="sg-subdomain">{s.subdomain}.pubpub.org</span>
								</td>
								<td className="num">{s.managerCount || '\u2014'}</td>
								<td className="num">{s.authorCount || '\u2014'}</td>
								<td className="num">{s.pubCount.toLocaleString()}</td>
								<td className="date">{fmtDate(s.createdAt)}</td>
								<td className="sg-td-status">
									{s.alreadyAdded && (
										<Tag minimal intent="success">
											Owned
										</Tag>
									)}
									{!s.alreadyAdded && s.pendingDirection === 'invite' && (
										<Tag minimal intent="primary">
											Invited
										</Tag>
									)}
									{!s.alreadyAdded && s.pendingDirection === 'request' && (
										<Tag minimal intent="warning">
											Asked to join
										</Tag>
									)}
								</td>
								<td className="sg-td-action">
									{s.alreadyAdded && (
										<Button
											small
											minimal
											intent="danger"
											icon="cross"
											text="Remove"
											onClick={() => handleRemove(s.communityId)}
										/>
									)}
									{!s.alreadyAdded && !s.pendingDirection && (
										<Button
											small
											minimal
											intent="primary"
											icon="plus"
											text={loginData.isSuperAdmin ? 'Add' : 'Invite'}
											onClick={() => handleInvite(s.communityId)}
										/>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

/* ────────────────────── suggested pubs tab ────────────────────── */

type SuggestedPub = {
	id: string;
	title: string;
	slug: string;
	avatar: string | null;
	description: string | null;
	communityId: string;
	communityTitle: string;
	communitySlug: string;
	communityDomain: string | null;
	byline: string | null;
	snippet: string | null;
	rank: number;
	publishedAt: string | null;
	alreadyAdded: boolean;
};

type SuggestedPubSortKey = 'title' | 'community' | 'published' | 'status';

const suggestedPubSortAccessors: Record<SuggestedPubSortKey, (s: SuggestedPub) => number | string> =
	{
		title: (s) => s.title.toLowerCase(),
		community: (s) => s.communityTitle.toLowerCase(),
		published: (s) => s.publishedAt || '',
		status: (s) => (s.alreadyAdded ? 1 : 0),
	};

const SuggestedPubsTab = ({ orgId }: { orgId: string }) => {
	const [suggestions, setSuggestions] = useState<SuggestedPub[] | null>(null);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [filter, setFilter] = useState('');
	const [sortKey, setSortKey] = useState<SuggestedPubSortKey>('published');
	const [sortDir, setSortDir] = useState<SortDir>('desc');
	const [expandedSnippets, setExpandedSnippets] = useState<Set<string>>(new Set());
	const [page, setPage] = useState(0);
	const pageSize = 50;
	const fetchedRef = useRef(false);

	const fetchPage = useCallback(
		async (pageNum: number) => {
			setLoading(true);
			try {
				const url = `/api/orgs/${orgId}/suggested-pubs?limit=${pageSize}&offset=${pageNum * pageSize}`;
				const data = await apiFetch.get(url);
				const result = data as any;
				setSuggestions(result.pubs ?? result);
				setTotal(result.total ?? (result.pubs ?? result).length);
				setPage(pageNum);
			} catch {
				setSuggestions([]);
				setTotal(0);
			} finally {
				setLoading(false);
			}
		},
		[orgId],
	);

	useEffect(() => {
		if (fetchedRef.current) return;
		fetchedRef.current = true;
		fetchPage(0);
	}, [fetchPage]);

	const handleAdd = useCallback(
		async (pubId: string) => {
			await apiFetch.post(`/api/orgs/${orgId}/pubs`, { pubId });
			await fetchPage(page);
		},
		[orgId, page, fetchPage],
	);

	const handleRemove = useCallback(
		async (pubId: string) => {
			await apiFetch.delete(`/api/orgs/${orgId}/pubs/${pubId}`);
			await fetchPage(page);
		},
		[orgId, page, fetchPage],
	);

	const handleSort = (key: SuggestedPubSortKey) => {
		if (sortKey === key) {
			setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
		} else {
			setSortKey(key);
			setSortDir(key === 'title' || key === 'community' ? 'asc' : 'desc');
		}
	};

	const sortArrow = (key: SuggestedPubSortKey) => {
		if (sortKey !== key) return null;
		return <span className="sg-sort-arrow">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
	};

	const sorted = useMemo(() => {
		if (!suggestions) return [];
		let rows = suggestions;
		if (filter.trim()) {
			const l = filter.toLowerCase();
			rows = rows.filter(
				(s) =>
					s.title.toLowerCase().includes(l) ||
					(s.description || '').toLowerCase().includes(l) ||
					(s.byline || '').toLowerCase().includes(l) ||
					s.communityTitle.toLowerCase().includes(l),
			);
		}
		const accessor = suggestedPubSortAccessors[sortKey];
		return [...rows].sort((a, b) => {
			const va = accessor(a);
			const vb = accessor(b);
			const cmp = va < vb ? -1 : va > vb ? 1 : 0;
			return sortDir === 'asc' ? cmp : -cmp;
		});
	}, [suggestions, filter, sortKey, sortDir]);

	if (loading || !suggestions) {
		return (
			<div className="tab-suggested">
				<SkeletonTable rows={6} cols={5} />
			</div>
		);
	}

	if (suggestions.length === 0) {
		return (
			<div className="tab-suggested">
				<div className="suggested-empty">
					No suggested pubs found. Ask a superadmin to configure pub search terms for this
					org.
				</div>
			</div>
		);
	}

	const addedCount = suggestions.filter((s) => s.alreadyAdded).length;
	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className="tab-suggested">
			<div className="sg-summary-bar">
				<span className="sg-summary-stat">
					<strong>{total}</strong> pubs discovered
				</span>
				<span className="sg-summary-sep" />
				<span className="sg-summary-stat">
					<strong>{addedCount}</strong> added on this page
				</span>
				<InputGroup
					className="sg-filter"
					leftIcon="search"
					placeholder="Filter by title, author, or community..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					small
				/>
			</div>
			<div className="sg-help">
				Based on your org&rsquo;s configured pub search terms. Results are from full-text
				search across all publicly released pubs.
			</div>
			<div className="data-table-wrapper">
				<table className="data-table sg-table">
					<thead>
						<tr>
							<th className="sg-th sg-th-title" onClick={() => handleSort('title')}>
								Pub {sortArrow('title')}
							</th>
							<th
								className="sg-th sg-th-community"
								onClick={() => handleSort('community')}
							>
								Community {sortArrow('community')}
							</th>
							<th
								className="sg-th sg-th-date"
								onClick={() => handleSort('published')}
							>
								Published {sortArrow('published')}
							</th>
							<th className="sg-th sg-th-status" onClick={() => handleSort('status')}>
								Status {sortArrow('status')}
							</th>
							<th className="sg-th sg-th-action" />
						</tr>
					</thead>
					<tbody>
						{sorted.map((s) => (
							<tr key={s.id} className={s.alreadyAdded ? 'sg-row-added' : ''}>
								<td className="sg-td-title">
									<a
										href={
											s.communityDomain
												? `https://${s.communityDomain}/pub/${s.slug}`
												: `https://${s.communitySlug}.pubpub.org/pub/${s.slug}`
										}
										target="_blank"
										rel="noopener noreferrer"
										className="sg-title"
									>
										{s.title}
									</a>
									{s.byline && <span className="sg-desc">{s.byline}</span>}
									{s.snippet && (
										<span
											className={`sg-snippet${expandedSnippets.has(s.id) ? ' sg-snippet-expanded' : ''}`}
											role="button"
											tabIndex={0}
											onClick={() =>
												setExpandedSnippets((prev) => {
													const next = new Set(prev);
													if (next.has(s.id)) next.delete(s.id);
													else next.add(s.id);
													return next;
												})
											}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													setExpandedSnippets((prev) => {
														const next = new Set(prev);
														if (next.has(s.id)) next.delete(s.id);
														else next.add(s.id);
														return next;
													});
												}
											}}
											// biome-ignore lint/security: snippet HTML is server-generated by ts_headline with safe <mark> tags only
											dangerouslySetInnerHTML={{ __html: s.snippet }}
										/>
									)}
								</td>
								<td>
									<a
										href={
											s.communityDomain
												? `https://${s.communityDomain}`
												: `https://${s.communitySlug}.pubpub.org`
										}
										target="_blank"
										rel="noopener noreferrer"
										className="sg-community-link"
									>
										{s.communityTitle}
									</a>
								</td>
								<td className="date">
									{s.publishedAt ? fmtDate(s.publishedAt) : '\u2014'}
								</td>
								<td className="sg-td-status">
									{s.alreadyAdded && (
										<Tag minimal intent="success">
											Added
										</Tag>
									)}
								</td>
								<td className="sg-td-action">
									{s.alreadyAdded ? (
										<Button
											small
											minimal
											intent="danger"
											icon="cross"
											text="Remove"
											onClick={() => handleRemove(s.id)}
										/>
									) : (
										<Button
											small
											minimal
											intent="primary"
											icon="plus"
											text="Add"
											onClick={() => handleAdd(s.id)}
										/>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{totalPages > 1 && (
				<div className="sg-pagination">
					<Button
						small
						minimal
						icon="chevron-left"
						disabled={page === 0}
						onClick={() => fetchPage(page - 1)}
					/>
					<span className="sg-page-info">
						Page {page + 1} of {totalPages}
					</span>
					<Button
						small
						minimal
						icon="chevron-right"
						disabled={page >= totalPages - 1}
						onClick={() => fetchPage(page + 1)}
					/>
				</div>
			)}
		</div>
	);
};

/* ────────────────────── main component ────────────────────── */

const OrgData = (props: Props) => {
	const [orgData, setOrgData] = useState(props.orgData);
	const { loginData } = usePageContext();
	const org = orgData.org;
	const accentDark = org.accentColorDark || '#2D2E2F';
	const accentLight = org.accentColorLight || '#FFFFFF';

	// Time range state for analytics
	const [activeRange, setActiveRange] = useState<QuickRange | null>('1yr');
	const [customStart, setCustomStart] = useState(daysAgo(365));
	const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));

	const refetchData = useCallback(
		async (start: string, end: string) => {
			try {
				const data = await apiFetch.get(
					`/api/orgs/slug/${org.slug}/data?startDate=${start}&endDate=${end}`,
				);
				setOrgData(data as OrgDataPayload);
			} catch {
				// keep existing data on error
			}
		},
		[org.slug],
	);

	const handleRangeChange = useCallback(
		(r: QuickRange) => {
			setActiveRange(r);
			const start = daysAgo(quickRangeDays[r]);
			const end = new Date().toISOString().slice(0, 10);
			setCustomStart(start);
			setCustomEnd(end);
			refetchData(start, end);
		},
		[refetchData],
	);

	const handleCustomStartChange = useCallback(
		(val: string) => {
			setCustomStart(val);
			setActiveRange(null);
			refetchData(val, customEnd);
		},
		[customEnd, refetchData],
	);

	const handleCustomEndChange = useCallback(
		(val: string) => {
			setCustomEnd(val);
			setActiveRange(null);
			refetchData(customStart, val);
		},
		[customStart, refetchData],
	);

	const hasAnalytics = orgData.analyticsScope && orgData.analyticsScope.grantedCount > 0;
	const isOrgAdmin = orgData.viewerPermissions === 'admin';

	return (
		<div className="org-data-component">
			{/* Header bar */}
			<div className="od-header" style={{ backgroundColor: accentDark }}>
				<div className="od-header-inner">
					<a
						href={`/org/${org.slug}`}
						className="od-header-brand"
						style={{ color: accentLight }}
					>
						{org.avatar && <img className="od-header-avatar" src={org.avatar} alt="" />}
						<span className="od-header-title">{org.title}</span>
					</a>
					<div className="od-header-actions">
						{!org.isActive && loginData.isSuperAdmin && (
							<Tag intent="warning">Inactive</Tag>
						)}
						{org.isPrivate && <Tag intent="primary">Private</Tag>}
						<a
							href="/orgs/docs"
							className="od-header-link"
							style={{ color: accentLight }}
						>
							Docs
						</a>
						<a
							href={`/org/${org.slug}/data`}
							className="od-header-link"
							style={{ color: accentLight }}
						>
							Dashboard
						</a>
						{loginData.id ? (
							<UserMenu loginData={loginData} />
						) : (
							<a
								href={`/login?redirect=/org/${org.slug}/data`}
								className="od-header-link"
								style={{ color: accentLight }}
							>
								Log in
							</a>
						)}
					</div>
				</div>
			</div>

			{/* Summary strip */}
			<div className="od-summary-strip">
				<div className="od-summary-inner">
					<div className="od-summary-item">
						<strong>{orgData.summary.communityCount}</strong> communities
					</div>
					<div className="od-summary-sep" />
					<div className="od-summary-item">
						<strong>{orgData.summary.pubCount.toLocaleString()}</strong> publications
					</div>
					<div className="od-summary-sep" />
					<div className="od-summary-item">
						<strong>{orgData.summary.authorCount.toLocaleString()}</strong> authors
					</div>
					<div className="od-summary-sep" />
					<div className="od-summary-item">
						<strong>{orgData.summary.releaseCount.toLocaleString()}</strong> releases
					</div>
					<div className="od-summary-sep" />
					<div className="od-summary-item">
						<strong>{orgData.summary.pubsThisMonth}</strong> pubs this month
					</div>
					{hasAnalytics && orgData.summary.totalPageViews > 0 && (
						<>
							<div className="od-summary-sep" />
							<div className="od-summary-item">
								<strong>{orgData.summary.totalPageViews.toLocaleString()}</strong>{' '}
								page views
							</div>
						</>
					)}
				</div>
			</div>

			{/* Tabbed content */}
			<div className="od-body">
				<div className="od-body-inner">
					<Tabs
						id="org-data-tabs"
						large
						renderActiveTabPanelOnly
						defaultSelectedTabId="overview"
					>
						<Tab
							id="overview"
							title="Overview"
							panel={
								<OverviewTab
									orgData={orgData}
									onRangeChange={handleRangeChange}
									activeRange={activeRange}
									customStart={customStart}
									customEnd={customEnd}
									onCustomStartChange={handleCustomStartChange}
									onCustomEndChange={handleCustomEndChange}
								/>
							}
						/>
						<Tab
							id="communities"
							title="Communities"
							panel={<CommunitiesTab orgData={orgData} />}
						/>
						<Tab id="pubs" title="Publications" panel={<PubsTab orgData={orgData} />} />
						<Tab
							id="authors"
							title="Authors"
							panel={<AuthorsTab orgData={orgData} />}
						/>
						<Tab
							id="collections"
							title="Collections"
							panel={<CollectionsTab orgData={orgData} />}
						/>
						<Tab id="graph" title="Graphs" panel={<OrgGraphTab orgData={orgData} />} />
						{isOrgAdmin && (
							<Tab
								id="suggested"
								title="Suggested Communities"
								panel={<SuggestedCommunitiesTab orgId={org.id} />}
							/>
						)}
						{isOrgAdmin && (
							<Tab
								id="suggested-pubs"
								title="Suggested Pubs"
								panel={<SuggestedPubsTab orgId={org.id} />}
							/>
						)}
						{isOrgAdmin && (
							<Tab
								id="templates"
								title="Templates"
								panel={<OrgTemplatesTab orgId={org.id} />}
							/>
						)}
						{isOrgAdmin && (
							<Tab
								id="settings"
								title="Settings"
								panel={<SettingsTab orgData={orgData} />}
							/>
						)}
					</Tabs>
				</div>
			</div>
		</div>
	);
};

export default OrgData;
