import React, { useCallback, useEffect, useState } from 'react';

import { Button, ButtonGroup, Checkbox, NonIdealState, Tag } from '@blueprintjs/core';
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { apiFetch } from 'client/utils/apiFetch';

import './platformAnalytics.scss';

type MonthlySeriesRow = { month: string; count: number; spam: number };
type MonthlySeries = MonthlySeriesRow[];
type SimpleSeriesRow = { month: string; count: number };

type Totals = { communities: number; users: number; pubs: number; pageviews: number };

type AnalyticsData = {
	totals: Totals;
	spam: Totals;
	communitiesByMonth: MonthlySeries;
	usersByMonth: MonthlySeries;
	pubsByMonth: MonthlySeries;
	pageviewsByMonth: MonthlySeries;
	activeCommunityTrendActivity: SimpleSeriesRow[];
	activeCommunityTrendPubs: SimpleSeriesRow[];
};

type PeriodData = {
	counts: Totals;
	spam: Totals;
	newCommunities: {
		title: string;
		subdomain: string;
		createdAt: string;
		description: string;
		isSpam: boolean;
	}[];
	totalNewCommunities: number;
	page: number;
	pageSize: number;
};

const fmt = (n: number): string => {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
};

const fmtMonth = (s: string): string => {
	const d = new Date(s);
	return d.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
};

const COLORS = {
	communities: '#2B95D6',
	users: '#15B371',
	pubs: '#D9822B',
	pageviews: '#7157D9',
	activityTrend: '#F55656',
	pubTrend: '#D9822B',
};

/** Convert raw monthly counts into a cumulative series. */
function toCumulative(series: MonthlySeries) {
	let total = 0;
	let spamTotal = 0;
	return series.map((d) => {
		total += d.count;
		spamTotal += d.spam;
		return {
			month: d.month,
			count: d.count,
			spam: d.spam,
			cumulative: total,
			cumulativeSpam: spamTotal,
		};
	});
}

const ScalarCard = ({
	label,
	value,
	color,
	spamValue,
	showSpam,
}: {
	label: string;
	value: string;
	color: string;
	spamValue?: number;
	showSpam?: boolean;
}) => (
	<div className="scalar-card" style={{ borderLeftColor: color }}>
		<div className="scalar-value">{value}</div>
		{showSpam && spamValue !== undefined && (
			<div className="scalar-spam">(Spam: {fmt(spamValue)})</div>
		)}
		<div className="scalar-label">{label}</div>
	</div>
);

const GrowthChart = ({
	title,
	data,
	color,
	showSpam,
}: {
	title: string;
	data: MonthlySeries;
	color: string;
	showSpam?: boolean;
}) => {
	const cumData = toCumulative(data);
	return (
		<div className="chart-card">
			<h4>{title}</h4>
			<ResponsiveContainer width="100%" height={200}>
				<AreaChart data={cumData}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10 }} />
					<YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
					<Tooltip
						labelFormatter={fmtMonth}
						formatter={(v: number, name: string) => [
							fmt(v),
							name === 'cumulativeSpam' ? 'Spam' : 'Cumulative',
						]}
					/>
					<Area
						type="monotone"
						dataKey="cumulative"
						stroke={color}
						fill={color}
						fillOpacity={0.15}
					/>
					{showSpam && (
						<Area
							type="monotone"
							dataKey="cumulativeSpam"
							stroke={color}
							fill="none"
							strokeDasharray="4 3"
							strokeOpacity={0.6}
						/>
					)}
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
};

const MonthlyChart = ({
	title,
	data,
	color,
	showSpam,
}: {
	title: string;
	data: MonthlySeries;
	color: string;
	showSpam?: boolean;
}) => (
	<div className="chart-card">
		<h4>{title}</h4>
		<ResponsiveContainer width="100%" height={200}>
			<LineChart data={data}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10 }} />
				<YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
				<Tooltip
					labelFormatter={fmtMonth}
					formatter={(v: number, name: string) => [
						fmt(v),
						name === 'spam' ? 'Spam' : 'Count',
					]}
				/>
				<Line type="monotone" dataKey="count" stroke={color} dot={false} />
				{showSpam && (
					<Line
						type="monotone"
						dataKey="spam"
						stroke={color}
						dot={false}
						strokeDasharray="4 3"
						strokeOpacity={0.6}
					/>
				)}
			</LineChart>
		</ResponsiveContainer>
	</div>
);

const ActiveCommunityChart = ({
	activityData,
	pubData,
}: {
	activityData: SimpleSeriesRow[];
	pubData: SimpleSeriesRow[];
}) => {
	// Merge the two series by month
	const monthMap = new Map<
		string,
		{ month: string; byActivity: number; byPubCreation: number }
	>();
	for (const d of activityData) {
		monthMap.set(d.month, { month: d.month, byActivity: d.count, byPubCreation: 0 });
	}
	for (const d of pubData) {
		const existing = monthMap.get(d.month);
		if (existing) {
			existing.byPubCreation = d.count;
		} else {
			monthMap.set(d.month, { month: d.month, byActivity: 0, byPubCreation: d.count });
		}
	}
	const merged = [...monthMap.values()].sort(
		(a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
	);

	return (
		<div className="chart-card chart-card-wide">
			<h4>Active Communities (Monthly)</h4>
			<ResponsiveContainer width="100%" height={200}>
				<LineChart data={merged}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10 }} />
					<YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
					<Tooltip labelFormatter={fmtMonth} />
					<Legend />
					<Line
						type="monotone"
						dataKey="byActivity"
						name="By Activity"
						stroke={COLORS.activityTrend}
						dot={false}
					/>
					<Line
						type="monotone"
						dataKey="byPubCreation"
						name="By Pub Creation"
						stroke={COLORS.pubTrend}
						dot={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};

// ── Date range helpers ──────────────────────────────────────────────────────

type PresetKey = '30d' | '90d' | '1y' | '2y' | 'custom';
const PRESETS: { key: PresetKey; label: string; days?: number }[] = [
	{ key: '30d', label: '30 days', days: 30 },
	{ key: '90d', label: '90 days', days: 90 },
	{ key: '1y', label: '1 year', days: 365 },
	{ key: '2y', label: '2 years', days: 730 },
	{ key: 'custom', label: 'Custom' },
];

function presetRange(days: number) {
	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - days);
	return {
		startDate: start.toISOString().slice(0, 10),
		endDate: end.toISOString().slice(0, 10),
	};
}

// ── Period Explorer sub-component ───────────────────────────────────────────

const PeriodExplorer = ({ showSpam }: { showSpam: boolean }) => {
	const [preset, setPreset] = useState<PresetKey>('1y');
	const [startDate, setStartDate] = useState(() => presetRange(365).startDate);
	const [endDate, setEndDate] = useState(() => presetRange(365).endDate);
	const [period, setPeriod] = useState<PeriodData | null>(null);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(0);

	const fetchPeriod = useCallback(async (sd: string, ed: string, pg: number) => {
		setLoading(true);
		try {
			const res = await apiFetch.get(
				`/api/platformAnalytics/period?startDate=${sd}&endDate=${ed}&page=${pg}`,
			);
			setPeriod(res as PeriodData);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPeriod(startDate, endDate, page);
	}, [startDate, endDate, page, fetchPeriod]);

	const handlePreset = (p: PresetKey) => {
		setPreset(p);
		if (p !== 'custom') {
			const days = PRESETS.find((x) => x.key === p)!.days!;
			const range = presetRange(days);
			setStartDate(range.startDate);
			setEndDate(range.endDate);
			setPage(0);
		}
	};

	const totalPages = period ? Math.ceil(period.totalNewCommunities / period.pageSize) : 0;

	return (
		<div className="period-explorer">
			<div className="period-controls">
				<ButtonGroup>
					{PRESETS.map((p) => (
						<Button
							key={p.key}
							active={preset === p.key}
							onClick={() => handlePreset(p.key)}
							small
						>
							{p.label}
						</Button>
					))}
				</ButtonGroup>
				{preset === 'custom' && (
					<span className="custom-dates">
						<input
							type="date"
							value={startDate}
							onChange={(e) => {
								setStartDate(e.target.value);
								setPage(0);
							}}
						/>
						<span className="date-sep">–</span>
						<input
							type="date"
							value={endDate}
							onChange={(e) => {
								setEndDate(e.target.value);
								setPage(0);
							}}
						/>
					</span>
				)}
			</div>

			{loading && !period && (
				<>
					<div className="scalar-row">
						{[0, 1, 2, 3].map((i) => (
							<div className="scalar-card skeleton-stat" key={i}>
								<div className="skeleton-line skeleton-value" />
								<div className="skeleton-line skeleton-label" />
							</div>
						))}
					</div>
					{[0, 1, 2, 3, 4, 5].map((j) => (
						<div className="skeleton-table-row" key={j}>
							<div className="skeleton-line skeleton-cell" />
							<div className="skeleton-line skeleton-cell" />
							<div className="skeleton-line skeleton-cell-short" />
							<div className="skeleton-line skeleton-cell" />
						</div>
					))}
				</>
			)}

			{period && (
				<>
					<div className="scalar-row">
						<ScalarCard
							label="New Communities"
							value={fmt(period.counts.communities)}
							color={COLORS.communities}
							spamValue={period.spam.communities}
							showSpam={showSpam}
						/>
						<ScalarCard
							label="New Users"
							value={fmt(period.counts.users)}
							color={COLORS.users}
							spamValue={period.spam.users}
							showSpam={showSpam}
						/>
						<ScalarCard
							label="New Pubs"
							value={fmt(period.counts.pubs)}
							color={COLORS.pubs}
							spamValue={period.spam.pubs}
							showSpam={showSpam}
						/>
						<ScalarCard
							label="Pageviews"
							value={fmt(period.counts.pageviews)}
							color={COLORS.pageviews}
							spamValue={period.spam.pageviews}
							showSpam={showSpam}
						/>
					</div>

					{period.newCommunities.length > 0 && (
						<>
							<h4 className="table-title">
								New Communities ({period.totalNewCommunities})
							</h4>
							<table className="new-communities-table">
								<thead>
									<tr>
										<th>Title</th>
										<th>Subdomain</th>
										<th>Created</th>
										{showSpam && <th>Spam</th>}
										<th>Description</th>
									</tr>
								</thead>
								<tbody>
									{period.newCommunities.map((c) => (
										<tr key={c.subdomain}>
											<td>{c.title}</td>
											<td>
												<a
													href={`https://${c.subdomain}.pubpub.org`}
													target="_blank"
													rel="noopener noreferrer"
												>
													{c.subdomain}
												</a>
											</td>
											<td>
												{new Date(c.createdAt).toLocaleDateString(
													undefined,
													{
														year: 'numeric',
														month: 'short',
														day: 'numeric',
													},
												)}
											</td>
											{showSpam && (
												<td>
													{c.isSpam && (
														<Tag intent="danger" minimal>
															Spam
														</Tag>
													)}
												</td>
											)}
											<td className="desc-cell">{c.description}</td>
										</tr>
									))}
								</tbody>
							</table>
							{totalPages > 1 && (
								<div className="pagination">
									<Button
										small
										disabled={page === 0}
										onClick={() => setPage(page - 1)}
									>
										Previous
									</Button>
									<span className="page-info">
										Page {page + 1} of {totalPages}
									</span>
									<Button
										small
										disabled={page >= totalPages - 1}
										onClick={() => setPage(page + 1)}
									>
										Next
									</Button>
								</div>
							)}
						</>
					)}
					{period.newCommunities.length === 0 && (
						<p className="no-data">No new communities in this period.</p>
					)}
				</>
			)}
		</div>
	);
};

// ── Main component ──────────────────────────────────────────────────────────

const PlatformAnalytics = () => {
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showSpam, setShowSpam] = useState(false);

	useEffect(() => {
		apiFetch
			.get('/api/platformAnalytics')
			.then(setData)
			.catch((err) => setError(err.message));
	}, []);

	if (error) {
		return <NonIdealState icon="error" title="Failed to load analytics" description={error} />;
	}

	if (!data) {
		return (
			<div className="platform-analytics">
				<h3>PubPub Platform Analytics</h3>

				<section className="section-label">All-Time Totals</section>
				<div className="scalar-row">
					{[0, 1, 2, 3].map((i) => (
						<div className="scalar-card skeleton-stat" key={i}>
							<div className="skeleton-line skeleton-value" />
							<div className="skeleton-line skeleton-label" />
						</div>
					))}
				</div>

				<section className="section-label">Cumulative Growth</section>
				<div className="chart-row">
					{[0, 1, 2, 3].map((i) => (
						<div className="chart-card" key={i}>
							<div className="skeleton-line skeleton-heading" />
							<div className="skeleton-chart" />
						</div>
					))}
				</div>

				<section className="section-label">Monthly Growth</section>
				<div className="chart-row">
					{[0, 1, 2, 3].map((i) => (
						<div className="chart-card" key={i}>
							<div className="skeleton-line skeleton-heading" />
							<div className="skeleton-chart" />
						</div>
					))}
				</div>

				<section className="section-label">Active Communities</section>
				<div className="chart-row">
					<div className="chart-card chart-card-wide">
						<div className="skeleton-line skeleton-heading" />
						<div className="skeleton-chart" />
					</div>
				</div>

				<section className="section-label">Period Explorer</section>
				<div className="period-explorer">
					<div className="skeleton-line skeleton-button-row" />
					<div className="scalar-row">
						{[0, 1, 2, 3].map((i) => (
							<div className="scalar-card skeleton-stat" key={i}>
								<div className="skeleton-line skeleton-value" />
								<div className="skeleton-line skeleton-label" />
							</div>
						))}
					</div>
					{[0, 1, 2, 3, 4, 5].map((j) => (
						<div className="skeleton-table-row" key={j}>
							<div className="skeleton-line skeleton-cell" />
							<div className="skeleton-line skeleton-cell" />
							<div className="skeleton-line skeleton-cell-short" />
							<div className="skeleton-line skeleton-cell" />
						</div>
					))}
				</div>
			</div>
		);
	}

	const { totals, spam } = data;

	return (
		<div className="platform-analytics">
			<div className="analytics-header">
				<h3>PubPub Platform Analytics</h3>
				<Checkbox
					checked={showSpam}
					onChange={(e) => setShowSpam((e.target as HTMLInputElement).checked)}
					label="Show spam"
				/>
			</div>

			<section className="section-label">All-Time Totals</section>
			<div className="scalar-row">
				<ScalarCard
					label="Communities"
					value={fmt(totals.communities)}
					color={COLORS.communities}
					spamValue={spam.communities}
					showSpam={showSpam}
				/>
				<ScalarCard
					label="Registered Users"
					value={fmt(totals.users)}
					color={COLORS.users}
					spamValue={spam.users}
					showSpam={showSpam}
				/>
				<ScalarCard
					label="Pubs"
					value={fmt(totals.pubs)}
					color={COLORS.pubs}
					spamValue={spam.pubs}
					showSpam={showSpam}
				/>
				<ScalarCard
					label="Pageviews"
					value={fmt(totals.pageviews)}
					color={COLORS.pageviews}
					spamValue={spam.pageviews}
					showSpam={showSpam}
				/>
			</div>

			<section className="section-label">Cumulative Growth</section>
			<div className="chart-row">
				<GrowthChart
					title="Communities"
					data={data.communitiesByMonth}
					color={COLORS.communities}
					showSpam={showSpam}
				/>
				<GrowthChart
					title="Users"
					data={data.usersByMonth}
					color={COLORS.users}
					showSpam={showSpam}
				/>
				<GrowthChart
					title="Pubs"
					data={data.pubsByMonth}
					color={COLORS.pubs}
					showSpam={showSpam}
				/>
				<GrowthChart
					title="Pageviews"
					data={data.pageviewsByMonth}
					color={COLORS.pageviews}
					showSpam={showSpam}
				/>
			</div>

			<section className="section-label">Monthly Growth</section>
			<div className="chart-row">
				<MonthlyChart
					title="Community Growth"
					data={data.communitiesByMonth}
					color={COLORS.communities}
					showSpam={showSpam}
				/>
				<MonthlyChart
					title="User Growth"
					data={data.usersByMonth}
					color={COLORS.users}
					showSpam={showSpam}
				/>
				<MonthlyChart
					title="Pub Growth"
					data={data.pubsByMonth}
					color={COLORS.pubs}
					showSpam={showSpam}
				/>
				<MonthlyChart
					title="Pageviews"
					data={data.pageviewsByMonth}
					color={COLORS.pageviews}
					showSpam={showSpam}
				/>
			</div>

			<section className="section-label">Active Communities</section>
			<div className="chart-row">
				<ActiveCommunityChart
					activityData={data.activeCommunityTrendActivity}
					pubData={data.activeCommunityTrendPubs}
				/>
			</div>

			<section className="section-label">Period Explorer</section>
			<PeriodExplorer showSpam={showSpam} />
		</div>
	);
};

export default PlatformAnalytics;
