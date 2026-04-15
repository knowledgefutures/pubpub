import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, ButtonGroup, Callout, NonIdealState } from '@blueprintjs/core';
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { DashboardFrame } from 'components';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';

import './dashboardImpact2.scss';

// Country code → full name (browser Intl API)
const countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });
function countryName(code: string): string {
	if (!code || code.length !== 2) return code || 'Unknown';
	try {
		return countryDisplayNames.of(code.toUpperCase()) ?? code;
	} catch {
		return code;
	}
}

type DailyAnalytics = { date: string; visits: number; pageViews: number };
type TopPath = { path: string; count: number };
type CountryBreakdown = { country: string; count: number };
type DeviceBreakdown = { device: string; count: number };
type ReferrerBreakdown = { referrer: string; count: number };

type AnalyticsData = {
	daily: DailyAnalytics[];
	topPaths: TopPath[];
	countries: CountryBreakdown[];
	devices: DeviceBreakdown[];
	referrers: ReferrerBreakdown[];
	totals: { visits: number; pageViews: number };
	rawTotals: { visits: number; pageViews: number };
	pathTitles?: Record<string, string>;
	stale?: boolean;
};

type DateRange = '1d' | '7d' | '30d';

const fmt = (n: number): string => {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
};

const fmtDate = (s: string): string => {
	const d = new Date(s + 'T00:00:00');
	return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getRange = (r: DateRange) => {
	const end = new Date();
	const start = new Date();
	const days = r === '1d' ? 1 : r === '7d' ? 7 : 30;
	start.setDate(end.getDate() - days);
	return {
		startDate: start.toISOString().slice(0, 10),
		endDate: end.toISOString().slice(0, 10),
	};
};

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
	<div className="stat-card" style={{ borderLeftColor: color }}>
		<div className="stat-value">{value}</div>
		<div className="stat-label">{label}</div>
	</div>
);

const COLORS = { visits: '#2B95D6', pageViews: '#15B371' };

/** Compact table used inside data panels. */
const CompactTable = ({
	rows,
	columns,
}: {
	rows: Array<Record<string, any>>;
	columns: Array<{ key: string; label: string; render?: (v: any, row: any) => React.ReactNode }>;
}) => (
	<table className="compact-table">
		<thead>
			<tr>
				{columns.map((c) => (
					<th key={c.key}>{c.label}</th>
				))}
			</tr>
		</thead>
		<tbody>
			{rows.map((row) => (
				<tr key={columns.map((c) => row[c.key]).join('|')}>
					{columns.map((c) => (
						<td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>
					))}
				</tr>
			))}
		</tbody>
	</table>
);

/**
 * Resolve a display title for a path using the pathTitles map.
 * For /pub/slug/release/3 → looks up /pub/slug.
 * For /my-collection → looks up /my-collection.
 */
function pathTitle(path: string, titles?: Record<string, string>): string | null {
	if (!titles) return null;
	// Try /pub/{slug} match
	const pubMatch = path.match(/^\/pub\/([^/]+)/);
	if (pubMatch) {
		return titles[`/pub/${pubMatch[1]}`] ?? null;
	}
	// Try top-level /{slug}
	const topMatch = path.match(/^\/([^/]+)/);
	if (topMatch) {
		return titles[`/${topMatch[1]}`] ?? null;
	}
	return null;
}

const INITIAL_PATHS_SHOWN = 15;

// ─────────────────────────────────────────────────────────────────────────────

const DashboardImpact2 = () => {
	const { scopeData } = usePageContext();
	const {
		elements: { activeTargetType, activePub, activeCollection },
		activePermissions: { canView },
	} = scopeData;

	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [notConfigured, setNotConfigured] = useState(false);
	const [stale, setStale] = useState(false);
	const [dateRange, setDateRange] = useState<DateRange>('7d');
	const [showAllPaths, setShowAllPaths] = useState(false);

	const legacyImpactUrl = getDashUrl({
		mode: 'impact',
		pubSlug: activePub?.slug,
		collectionSlug: activeCollection?.slug,
	});

	// Build scope query params based on active dashboard scope
	const scopeParams = useMemo(() => {
		if (activeTargetType === 'pub' && activePub) {
			return `&pubSlug=${encodeURIComponent(activePub.slug)}`;
		}
		if (activeTargetType === 'collection' && activeCollection) {
			return `&collectionId=${encodeURIComponent(activeCollection.id)}`;
		}
		return '';
	}, [activeTargetType, activePub, activeCollection]);

	const fetchData = useCallback(
		async (range: DateRange) => {
			setLoading(true);
			setError(null);
			setStale(false);
			setNotConfigured(false);
			try {
				const { startDate, endDate } = getRange(range);
				const res = await fetch(
					`/api/impact2?startDate=${startDate}&endDate=${endDate}${scopeParams}`,
				);
				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					if (res.status === 503) {
						setNotConfigured(true);
						return;
					}
					throw new Error(body.error || `Request failed (${res.status})`);
				}
				const json: AnalyticsData = await res.json();
				setData(json);
				setStale(!!json.stale);
			} catch (err: any) {
				setError(err.message ?? 'Failed to load analytics');
			} finally {
				setLoading(false);
			}
		},
		[scopeParams],
	);

	useEffect(() => {
		if (canView) fetchData(dateRange);
	}, [dateRange, canView, fetchData]);

	const chartData = useMemo(
		() => (data ? data.daily.map((d) => ({ ...d, label: fmtDate(d.date) })) : []),
		[data],
	);

	if (!canView) {
		return (
			<DashboardFrame
				title="Impact"
				className="dashboard-impact2-container"
				// details={`Learn more about who your ${activeTargetName} is reaching.`}
			>
				<p>Login or ask the community administrator for access to impact data.</p>
			</DashboardFrame>
		);
	}

	return (
		<DashboardFrame
			title="Impact"
			className="dashboard-impact2-container"
			// details={`Learn more about who your ${activeTargetName} is reaching.`}
			controls={
				<ButtonGroup>
					<Button active={dateRange === '1d'} onClick={() => setDateRange('1d')} small>
						Today
					</Button>
					<Button active={dateRange === '7d'} onClick={() => setDateRange('7d')} small>
						7 days
					</Button>
					<Button active={dateRange === '30d'} onClick={() => setDateRange('30d')} small>
						30 days
					</Button>
				</ButtonGroup>
			}
		>
			<Callout intent="none" className="analytics-callout">
				This dashboard reflects recent activity based on edge data and is designed for
				quick, transient insight. It does not provide historical reporting or long-term
				retention. For comprehensive analytics, we strongly recommend connecting a dedicated
				analytics tool in <a href="/dash/settings/analytics-settings">Settings</a>.
				<br />
				<br />
				Legacy analytics remain available <a href={legacyImpactUrl}>here</a>. We'll announce
				more formal plans for the legacy analytics shortly. In the meantime, you can
				continue to view and download any historical data you might need. Please feel free
				to <a href="mailto:hello@pubpub.org?subject=Legacy%20Analytics">reach out</a> if you
				have any specific needs or feedback we should keep in mind.
			</Callout>

			{loading && (
				<div className="skeleton-container">
					{/* Top row: stats + chart */}
					<div className="top-row">
						<div className="stats-column">
							<div className="stat-card skeleton-stat">
								<div className="skeleton-line skeleton-value" />
								<div className="skeleton-line skeleton-label" />
							</div>
							<div className="stat-card skeleton-stat">
								<div className="skeleton-line skeleton-value" />
								<div className="skeleton-line skeleton-label" />
							</div>
						</div>
						<div className="chart-column">
							<div className="skeleton-line skeleton-heading" />
							<div className="skeleton-chart" />
						</div>
					</div>
					{/* Breakdowns skeleton (3-column) */}
					<div className="data-grid">
						{[0, 1, 2].map((i) => (
							<div className="data-panel" key={i}>
								<div className="skeleton-line skeleton-heading" />
								{[0, 1, 2, 3, 4, 5].map((j) => (
									<div className="skeleton-table-row" key={j}>
										<div className="skeleton-line skeleton-cell" />
										<div className="skeleton-line skeleton-cell-short" />
									</div>
								))}
							</div>
						))}
					</div>
					{/* Top Pages skeleton (full width) */}
					<div className="data-panel top-pages-panel">
						<div className="skeleton-line skeleton-heading" />
						{[0, 1, 2, 3, 4, 5, 6, 7].map((j) => (
							<div className="skeleton-table-row" key={j}>
								<div className="skeleton-line skeleton-cell" />
								<div className="skeleton-line skeleton-cell-short" />
							</div>
						))}
					</div>
				</div>
			)}

			{error && (
				<NonIdealState
					icon="warning-sign"
					title="Unable to load analytics"
					description={error}
					action={
						<Button onClick={() => fetchData(dateRange)} icon="refresh">
							Retry
						</Button>
					}
				/>
			)}

			{notConfigured && (
				<NonIdealState
					icon="chart"
					title="Community Impact Metrics not available"
					description="Analytics have not been configured for this instance. Contact your administrator to enable Cloudflare analytics."
				/>
			)}

			{!loading && !error && data && (
				<>
					{stale && (
						<div className="stale-callout">
							Data may be slightly delayed — try again in a few minutes.
						</div>
					)}

					{/* ── Row 1: Stats + Chart ── */}
					<div className="top-row">
						<div className="stats-column">
							<StatCard
								label="Pages Viewed"
								value={fmt(data.totals.pageViews)}
								color={COLORS.pageViews}
							/>
							<StatCard
								label="Unique Sessions"
								value={fmt(data.totals.visits)}
								color={COLORS.visits}
							/>
							<p className="fine-print">
								All numbers adjusted for suspected bot/spam traffic.*
							</p>
						</div>
						{chartData.length > 1 && (
							<div className="chart-column">
								<h3>Traffic Over Time</h3>
								<ResponsiveContainer width="100%" height={180}>
									<AreaChart data={chartData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#eee" />
										<XAxis dataKey="label" tick={{ fontSize: 11 }} />
										<YAxis
											tick={{ fontSize: 11 }}
											width={48}
											tickFormatter={fmt}
										/>
										<Tooltip formatter={(v: number) => v.toLocaleString()} />
										<Area
											type="monotone"
											dataKey="pageViews"
											name="Pages"
											stroke={COLORS.pageViews}
											fill={COLORS.pageViews}
											fillOpacity={0.08}
											strokeWidth={1.5}
										/>
										<Area
											type="monotone"
											dataKey="visits"
											name="Sessions"
											stroke={COLORS.visits}
											fill={COLORS.visits}
											fillOpacity={0.12}
											strokeWidth={1.5}
										/>
										<Legend
											iconSize={8}
											wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						)}
					</div>

					{/* ── Row 2: breakdowns (3-column) ── */}
					<div className="data-grid">
						{/* Countries */}
						{data.countries.length > 0 && (
							<div className="data-panel">
								<h3>Countries</h3>
								<CompactTable
									rows={data.countries.slice(0, 12).map((c) => ({
										...c,
										country: countryName(c.country),
									}))}
									columns={[
										{ key: 'country', label: 'Country' },
										{
											key: 'count',
											label: 'Views',
											render: (v: number) => fmt(v),
										},
									]}
								/>
							</div>
						)}

						{/* Referrers */}
						{data.referrers.length > 0 && (
							<div className="data-panel">
								<h3>Referrers</h3>
								<CompactTable
									rows={data.referrers.slice(0, 12)}
									columns={[
										{ key: 'referrer', label: 'Source' },
										{
											key: 'count',
											label: 'Views',
											render: (v: number) => fmt(v),
										},
									]}
								/>
							</div>
						)}

						{/* Devices */}
						{data.devices.length > 0 && (
							<div className="data-panel">
								<h3>Devices</h3>
								<CompactTable
									rows={(() => {
										const total = data.devices.reduce((s, d) => s + d.count, 0);
										return data.devices.map((d) => ({
											device: d.device,
											pct: total
												? `${((d.count / total) * 100).toFixed(1)}%`
												: '0%',
										}));
									})()}
									columns={[
										{ key: 'device', label: 'Type' },
										{ key: 'pct', label: '%' },
									]}
								/>
							</div>
						)}
					</div>

					{/* ── Row 3: Top Pages (full width) ── */}
					{data.topPaths.length > 0 && (
						<div className="data-panel top-pages-panel">
							<h3>Top Pages</h3>
							<CompactTable
								rows={data.topPaths.slice(
									0,
									showAllPaths ? data.topPaths.length : INITIAL_PATHS_SHOWN,
								)}
								columns={[
									{
										key: 'path',
										label: 'Page',
										render: (v: string) => {
											const title = pathTitle(v, data.pathTitles);
											return (
												<a href={v} title={v} className="path-cell">
													{title ? (
														<>
															<span className="path-title">
																{title}
															</span>
															<span className="path-url">{v}</span>
														</>
													) : (
														v
													)}
												</a>
											);
										},
									},
									{
										key: 'count',
										label: 'Views',
										render: (v: number) => fmt(v),
									},
								]}
							/>
							{data.topPaths.length > INITIAL_PATHS_SHOWN && (
								<button
									type="button"
									className="show-more-btn"
									onClick={() => setShowAllPaths(!showAllPaths)}
								>
									{showAllPaths ? 'Show less' : 'Show more'}
								</button>
							)}
						</div>
					)}

					{/* Footer */}
					<div className="analytics-footer">
						<p>
							* Totals adjusted to exclude known bot/spam routes. Sessions estimated
							proportionally. Raw totals: {fmt(data.rawTotals.visits)} sessions /{' '}
							{fmt(data.rawTotals.pageViews)} page views.
						</p>
						<p>
							All web analytics capture unavoidable noise. While we apply filtering
							and normalization, some non-human or ambiguous traffic almost surely
							persists. Treat these numbers as directional indicators, not exact
							measurements.
						</p>
						<p>
							Analytics sourced from Cloudflare edge traffic data. Today's data is
							refreshed at most every hour.
						</p>
					</div>
				</>
			)}
		</DashboardFrame>
	);
};

export default DashboardImpact2;
