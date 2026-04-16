import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, ButtonGroup, Callout, NonIdealState, Spinner } from '@blueprintjs/core';
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
import { usePageContext } from 'utils/hooks';

import './dashboardImpact.scss';

// ─── types ───────────────────────────────────────────────────────────────────

type DailyRow = { date: string; pageViews: number; uniquePageViews: number };
type CountryRow = { country: string; countryCode: string; count: number };
type ReferrerRow = { referrer: string; count: number };
type CampaignRow = { campaign: string; count: number };
type DeviceRow = { device_type: string; count: number };
type TopPageRow = { pageTitle: string; path: string; count: number };
type TopPubRow = {
	pubTitle: string;
	pubSlug: string | null;
	pubId: string;
	views: number;
	downloads: number;
};
type TopCollectionRow = {
	collectionTitle: string;
	collectionSlug: string | null;
	collectionId: string;
	count: number;
};

type AnalyticsData = {
	totalPageViews: number;
	totalUniqueVisits: number;
	totalDownloads: number;
	daily: DailyRow[];
	countries: CountryRow[];
	topPubs: TopPubRow[];
	topPages: TopPageRow[];
	topCollections: TopCollectionRow[];
	referrers: ReferrerRow[];
	campaigns: CampaignRow[];
	devices: DeviceRow[];
};

type QuickRange = '30d' | '90d' | '1yr' | '2yr';

// ─── constants ───────────────────────────────────────────────────────────────

const MAX_RANGE_DAYS = 365 * 2; // 2 years

/**
 * Temporary: set to `true` to show the migration banner. Remove this constant
 * and the <Callout> block once the Redshift import has completed in production.
 */
const SHOW_MIGRATION_BANNER = false;

// ─── helpers ─────────────────────────────────────────────────────────────────

const countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });
function countryName(code: string): string {
	if (!code || code.length !== 2) return code || 'Unknown';
	try {
		return countryDisplayNames.of(code.toUpperCase()) ?? code;
	} catch {
		return code;
	}
}

const fmt = (n: number): string => {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
};

const fmtDate = (s: string): string => {
	const d = new Date(s + 'T00:00:00');
	return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const toIso = (d: Date): string => d.toISOString().slice(0, 10);

const daysAgo = (n: number): string => {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return toIso(d);
};

const quickRangeDates = (r: QuickRange): { start: string; end: string } => {
	const days = r === '30d' ? 30 : r === '90d' ? 90 : r === '1yr' ? 365 : 730;
	return { start: daysAgo(days), end: toIso(new Date()) };
};

/** Clamp a date range to at most MAX_RANGE_DAYS. */
const clampRange = (start: string, end: string): { start: string; end: string } => {
	const s = new Date(start);
	const e = new Date(end);
	const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
	if (diff > MAX_RANGE_DAYS) {
		const clamped = new Date(e);
		clamped.setDate(clamped.getDate() - MAX_RANGE_DAYS);
		return { start: toIso(clamped), end };
	}
	if (diff < 0) {
		return { start: end, end: start };
	}
	return { start, end };
};

const COLORS = { pageViews: '#15B371', unique: '#2B95D6' };

// ─── CSV export ──────────────────────────────────────────────────────────────

let lastDownloadTs = 0;
function downloadCsv(filename: string, headers: string[], rows: string[][]) {
	const now = Date.now();
	if (now - lastDownloadTs < 1000) return;
	lastDownloadTs = now;
	const escapeCsv = (v: string) => {
		if (v.includes(',') || v.includes('"') || v.includes('\n')) {
			return `"${v.replace(/"/g, '""')}"`;
		}
		return v;
	};
	const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: false, view: window }));
	document.body.removeChild(a);
	setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ─── compact table with pagination ───────────────────────────────────────────

const PAGE_SIZE = 15;

const CompactTable = ({
	title,
	rows,
	columns,
	onExport,
	emptyMessage,
}: {
	title: string;
	rows: Array<Record<string, any>>;
	columns: Array<{
		key: string;
		label: string;
		align?: 'left' | 'right';
		flex?: boolean;
		render?: (v: any, row: any) => React.ReactNode;
	}>;
	onExport?: () => void;
	emptyMessage?: string;
}) => {
	const [page, setPage] = useState(0);
	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
	const start = page * PAGE_SIZE;
	const visible = rows.slice(start, start + PAGE_SIZE);
	const showPagination = rows.length > PAGE_SIZE;

	return (
		<div className="data-panel">
			<div className="panel-header">
				<h3>{title}</h3>
				{onExport && rows.length > 0 && (
					<button type="button" className="export-link" onClick={onExport}>
						Export
					</button>
				)}
			</div>
			{rows.length === 0 && emptyMessage ? (
				<>
					<table className="compact-table">
						<thead>
							<tr>
								{columns.map((c) => (
									<th
										key={c.key}
										className={
											[
												c.align === 'right' ? 'align-right' : '',
												c.flex ? 'col-flex' : '',
											]
												.filter(Boolean)
												.join(' ') || undefined
										}
									>
										{c.label}
									</th>
								))}
							</tr>
						</thead>
					</table>
					<div className="empty-message">{emptyMessage}</div>
				</>
			) : (
				<>
					<div className="table-scroll-area">
						<table className="compact-table">
							<thead>
								<tr>
									{columns.map((c) => (
										<th
											key={c.key}
											className={
												[
													c.align === 'right' ? 'align-right' : '',
													c.flex ? 'col-flex' : '',
												]
													.filter(Boolean)
													.join(' ') || undefined
											}
										>
											{c.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{visible.map((row) => (
									<tr key={columns.map((c) => row[c.key]).join('|')}>
										{columns.map((c) => (
											<td
												key={c.key}
												className={
													[
														c.align === 'right' ? 'align-right' : '',
														c.flex ? 'col-flex' : '',
													]
														.filter(Boolean)
														.join(' ') || undefined
												}
											>
												{c.render ? c.render(row[c.key], row) : row[c.key]}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{showPagination && (
						<div className="table-pagination">
							<span className="page-info">
								{start + 1}–{Math.min(start + PAGE_SIZE, rows.length)} of{' '}
								{rows.length}
							</span>
							<button
								type="button"
								disabled={page === 0}
								onClick={() => setPage((p) => p - 1)}
							>
								‹
							</button>
							<button
								type="button"
								disabled={page >= totalPages - 1}
								onClick={() => setPage((p) => p + 1)}
							>
								›
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
};

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
	<div className="stat-card" style={{ borderLeftColor: color }}>
		<div className="stat-value">{value}</div>
		<div className="stat-label">{label}</div>
	</div>
);

// ─── component ───────────────────────────────────────────────────────────────

const DashboardImpact = () => {
	const { scopeData, communityData } = usePageContext();
	const {
		elements: { activeTargetType, activePub, activeCollection },
		activePermissions: { canView },
	} = scopeData;

	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Date range state — quick-select buttons set both, custom inputs clear activeQuick
	const [startDate, setStartDate] = useState(() => daysAgo(90));
	const [endDate, setEndDate] = useState(() => toIso(new Date()));
	const [activeQuick, setActiveQuick] = useState<QuickRange | null>('90d');

	const handleQuickRange = (r: QuickRange) => {
		const { start, end } = quickRangeDates(r);
		setStartDate(start);
		setEndDate(end);
		setActiveQuick(r);
	};

	const handleStartChange = (val: string) => {
		const { start, end } = clampRange(val, endDate);
		setStartDate(start);
		setEndDate(end);
		setActiveQuick(null);
	};

	const handleEndChange = (val: string) => {
		const { start, end } = clampRange(startDate, val);
		setStartDate(start);
		setEndDate(end);
		setActiveQuick(null);
	};

	// Build scope query params
	const scopeParams = useMemo(() => {
		if (activeTargetType === 'pub' && activePub) {
			return `&pubId=${encodeURIComponent(activePub.id)}`;
		}
		if (activeTargetType === 'collection' && activeCollection) {
			return `&collectionId=${encodeURIComponent(activeCollection.id)}`;
		}
		return '';
	}, [activeTargetType, activePub, activeCollection]);

	const fetchData = useCallback(
		async (start: string, end: string) => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(
					`/api/analytics-impact?startDate=${start}&endDate=${end}${scopeParams}`,
				);
				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					throw new Error(body.error || `Request failed (${res.status})`);
				}
				const json: AnalyticsData = await res.json();
				setData(json);
			} catch (err: any) {
				setError(err.message ?? 'Failed to load analytics');
			} finally {
				setLoading(false);
			}
		},
		[scopeParams],
	);

	useEffect(() => {
		if (canView) fetchData(startDate, endDate);
	}, [startDate, endDate, canView, fetchData]);

	const chartData = useMemo(
		() => (data ? data.daily.map((d) => ({ ...d, label: fmtDate(d.date) })) : []),
		[data],
	);

	// Filter out referrers from the community's own domain, localhost, and pubpub.org
	const filteredReferrers = useMemo(() => {
		if (!data) return [];
		const ownHosts: string[] = ['localhost', 'pubpub.org', 'www.pubpub.org'];
		if (communityData.subdomain) {
			ownHosts.push(`${communityData.subdomain}.pubpub.org`);
		}
		if (communityData.domain) {
			ownHosts.push(communityData.domain);
		}
		return data.referrers.filter((r) => {
			try {
				const url = new URL(r.referrer);
				const host = url.hostname.replace(/^www\./, '');
				if (url.hostname === 'localhost' || url.hostname.startsWith('localhost:'))
					return false;
				return !ownHosts.some((h) => host === h || host === `www.${h}`);
			} catch {
				// 'Direct' or other non-URL values — keep them
				return true;
			}
		});
	}, [data, communityData.subdomain, communityData.domain]);

	// ── CSV export handlers ──────────────────────────────────────────────

	const exportCountries = () => {
		if (!data) return;
		downloadCsv(
			'countries.csv',
			['Country', 'Country Code', 'Pageviews'],
			data.countries.map((c) => [
				c.countryCode ? countryName(c.countryCode) : c.country,
				c.countryCode,
				String(c.count),
			]),
		);
	};

	const exportTopPubs = () => {
		if (!data) return;
		downloadCsv(
			'top-pubs.csv',
			['Title', 'URL', 'Pub ID', 'Views', 'Downloads'],
			data.topPubs.map((p) => [
				p.pubTitle,
				p.pubSlug ? `/pub/${p.pubSlug}` : '',
				p.pubId,
				String(p.views),
				String(p.downloads),
			]),
		);
	};

	const exportTopPages = () => {
		if (!data) return;
		downloadCsv(
			'top-pages.csv',
			['Page Title', 'URL', 'Pageviews'],
			data.topPages.map((p) => [
				p.pageTitle || p.path || '(home)',
				p.path || '/',
				String(p.count),
			]),
		);
	};

	const exportTopCollections = () => {
		if (!data) return;
		downloadCsv(
			'top-collections.csv',
			['Collection Title', 'URL', 'Collection ID', 'Pageviews'],
			data.topCollections.map((c) => [
				c.collectionTitle,
				c.collectionSlug ? `/${c.collectionSlug}` : '',
				c.collectionId,
				String(c.count),
			]),
		);
	};

	const exportReferrers = () => {
		if (!data) return;
		downloadCsv(
			'referrers.csv',
			['Referrer', 'Pageviews'],
			data.referrers.map((r) => [r.referrer, String(r.count)]),
		);
	};

	const exportCampaigns = () => {
		if (!data) return;
		downloadCsv(
			'campaigns.csv',
			['Campaign', 'Pageviews'],
			data.campaigns.map((c) => [c.campaign, String(c.count)]),
		);
	};

	const exportDevices = () => {
		if (!data) return;
		downloadCsv(
			'devices.csv',
			['Device', 'Pageviews'],
			data.devices.map((d) => [d.device_type, String(d.count)]),
		);
	};

	// ── Render ───────────────────────────────────────────────────────────

	if (!canView) {
		return (
			<DashboardFrame
				title="Impact"
				className="dashboard-impact-container"
				// details={`Learn more about who your ${activeTargetName} is reaching.`}
			>
				<p>Login or ask the community administrator for access to impact data.</p>
			</DashboardFrame>
		);
	}

	return (
		<DashboardFrame
			title="Impact"
			className="dashboard-impact-container"
			// details={`Learn more about who your ${activeTargetName} is reaching.`}
			controls={
				<div className="date-controls">
					<ButtonGroup>
						<Button
							active={activeQuick === '30d'}
							onClick={() => handleQuickRange('30d')}
							small
						>
							30 days
						</Button>
						<Button
							active={activeQuick === '90d'}
							onClick={() => handleQuickRange('90d')}
							small
						>
							90 days
						</Button>
						<Button
							active={activeQuick === '1yr'}
							onClick={() => handleQuickRange('1yr')}
							small
						>
							1 year
						</Button>
						<Button
							active={activeQuick === '2yr'}
							onClick={() => handleQuickRange('2yr')}
							small
						>
							2 years
						</Button>
					</ButtonGroup>
					<span className="date-inputs">
						<input
							type="date"
							value={startDate}
							max={endDate}
							onChange={(e) => handleStartChange(e.target.value)}
						/>
						<span className="date-sep">–</span>
						<input
							type="date"
							value={endDate}
							min={startDate}
							max={toIso(new Date())}
							onChange={(e) => handleEndChange(e.target.value)}
						/>
					</span>
				</div>
			}
		>
			{SHOW_MIGRATION_BANNER && (
				<Callout icon="info-sign" intent="warning" className="migration-banner">
					A data migration is in progress. Historical analytics data may be incomplete or
					unavailable for a few hours. Data will backfill automatically once the migration
					completes.
				</Callout>
			)}

			{loading && (
				<div className="loading-container">
					<Spinner />
				</div>
			)}

			{error && (
				<NonIdealState
					icon="warning-sign"
					title="Unable to load analytics"
					description={error}
					action={
						<Button onClick={() => fetchData(startDate, endDate)} icon="refresh">
							Retry
						</Button>
					}
				/>
			)}

			{!loading && !error && data && (
				<>
					{/* ── Row 1: Stats + Chart ── */}
					<div className="top-row">
						<div className="stats-column">
							<StatCard
								label="Total Pageviews"
								value={fmt(data.totalPageViews)}
								color={COLORS.pageViews}
							/>
							<StatCard
								label="Unique Visits"
								value={fmt(data.totalUniqueVisits)}
								color={COLORS.unique}
							/>
							<StatCard
								label="Downloads"
								value={fmt(data.totalDownloads)}
								color="#D9822B"
							/>
						</div>
						{chartData.length > 1 && (
							<div className="chart-column">
								<h3>Pageviews Over Time</h3>
								<ResponsiveContainer width="100%" height={220}>
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
											name="Pageviews"
											stroke={COLORS.pageViews}
											fill={COLORS.pageViews}
											fillOpacity={0.08}
											strokeWidth={1.5}
										/>
										<Area
											type="monotone"
											dataKey="uniquePageViews"
											name="Unique"
											stroke={COLORS.unique}
											fill={COLORS.unique}
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

					{/* ── Row 2: Top Pubs (2/3) | Countries (1/3) ── */}
					<div className="row-pubs-countries">
						<CompactTable
							title="Top Pubs"
							onExport={exportTopPubs}
							rows={data.topPubs}
							columns={[
								{
									key: 'pubTitle',
									label: 'Title',
									flex: true,
									render: (v: string, row: TopPubRow) =>
										row.pubSlug ? <a href={`/pub/${row.pubSlug}`}>{v}</a> : v,
								},
								{
									key: 'downloads',
									label: 'Downloads',
									align: 'right',
									render: (v: number) => fmt(v),
								},
								{
									key: 'views',
									label: 'Views',
									align: 'right',
									render: (v: number) => fmt(v),
								},
							]}
							emptyMessage="No pub data for this period."
						/>
						<CompactTable
							title="Countries"
							onExport={exportCountries}
							rows={data.countries.map((c) => ({
								...c,
								country: c.countryCode ? countryName(c.countryCode) : c.country,
							}))}
							columns={[
								{ key: 'country', label: 'Country' },
								{
									key: 'count',
									label: 'Views',
									align: 'right',
									render: (v: number) => fmt(v),
								},
							]}
							emptyMessage="No country data for this period."
						/>
					</div>

					{/* ── Row 3: Top Pages | Top Collections (50-50) ── */}
					<div className="row-half">
						<CompactTable
							title="Top Pages"
							onExport={exportTopPages}
							rows={data.topPages}
							columns={[
								{
									key: 'pageTitle',
									label: 'Page',
									render: (v: string, row: TopPageRow) => (
										<a href={row.path} title={row.path}>
											{v || row.path || '(home)'}
										</a>
									),
								},
								{
									key: 'count',
									label: 'Views',
									align: 'right',
									render: (v: number) => fmt(v),
								},
							]}
							emptyMessage="No page data for this period."
						/>
						<CompactTable
							title="Top Collections"
							onExport={exportTopCollections}
							rows={data.topCollections}
							columns={[
								{
									key: 'collectionTitle',
									label: 'Collection',
									render: (v: string, row: TopCollectionRow) =>
										row.collectionSlug ? (
											<a href={`/${row.collectionSlug}`}>{v}</a>
										) : (
											v
										),
								},
								{
									key: 'count',
									label: 'Views',
									align: 'right',
									render: (v: number) => fmt(v),
								},
							]}
							emptyMessage="No collection data for this period."
						/>
					</div>

					{/* ── Row 4: Referrers | Devices | Campaigns (always 3-col) ── */}
					<div className="row-third">
						<CompactTable
							title="Top Referrers"
							onExport={exportReferrers}
							rows={filteredReferrers}
							columns={[
								{
									key: 'referrer',
									label: 'Referrer',
									render: (v: string) => {
										try {
											const url = new URL(v);
											return (
												url.hostname +
												(url.pathname !== '/' ? url.pathname : '')
											);
										} catch {
											return v;
										}
									},
								},
								{
									key: 'count',
									label: 'Views',
									align: 'right',
									render: (v: number) => fmt(v),
								},
							]}
							emptyMessage="No referrer data for this period."
						/>
						<CompactTable
							title="Devices"
							onExport={exportDevices}
							rows={data.devices}
							columns={[
								{ key: 'device_type', label: 'Device' },
								{
									key: 'count',
									label: 'Views',
									align: 'right',
									render: (v: number) => fmt(v),
								},
							]}
							emptyMessage="No device data for this period."
						/>
						<CompactTable
							title="Top Campaigns"
							onExport={exportCampaigns}
							rows={data.campaigns}
							columns={[
								{ key: 'campaign', label: 'Campaign' },
								{
									key: 'count',
									label: 'Views',
									align: 'right',
									render: (v: number) => fmt(v),
								},
							]}
							emptyMessage="No campaign data for this period."
						/>
					</div>
				</>
			)}
		</DashboardFrame>
	);
};
export default DashboardImpact;
