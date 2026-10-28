import type { ContentSearchPub, ContentSearchSummary } from 'server/community/contentSearchQueries';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { InputGroup, NonIdealState, Spinner, Tab, type TabId, Tabs, Tag } from '@blueprintjs/core';

type SortField = 'name' | 'pubCount' | 'communityCount';
type SortDir = 'asc' | 'desc';
type DetailTab = 'pubs' | 'communities';
type PubSortField = 'relevance' | 'date';
type PubSortDir = 'asc' | 'desc';

const formatNumber = (n: number) => {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
};

const plural = (n: number, w: string, p?: string) => `${n} ${n === 1 ? w : p || `${w}s`}`;

const formatDate = (dateStr: string | null) => {
	if (!dateStr) return null;
	const d = new Date(dateStr);
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/* ------------------------------------------------------------------ */
/* Pub card                                                           */
/* ------------------------------------------------------------------ */
const PubCard = ({
	pub,
	showCommunity = true,
}: {
	pub: ContentSearchPub;
	showCommunity?: boolean;
}) => {
	const pubUrl = `https://${pub.communitySubdomain}.pubpub.org/pub/${pub.slug}`;
	return (
		<div className="cs-pub-card">
			<a
				className="cs-pub-card-title"
				href={pubUrl}
				target="_blank"
				rel="noopener noreferrer"
			>
				{pub.title}
			</a>
			<div className="cs-pub-card-meta">
				{showCommunity && (
					<span className="cs-pub-card-community">{pub.communityTitle}</span>
				)}
				{showCommunity && pub.byline && ' · '}
				{pub.byline && <span className="cs-pub-card-byline">{pub.byline}</span>}
				{pub.publishedAt && (
					<>
						{(showCommunity || pub.byline) && ' · '}
						<span className="cs-pub-card-date">{formatDate(pub.publishedAt)}</span>
					</>
				)}
			</div>
			{pub.matchContext && (
				<div
					className="cs-pub-card-context"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: ts_headline output with <b> tags
					dangerouslySetInnerHTML={{ __html: pub.matchContext }}
				/>
			)}
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Community group (expandable)                                       */
/* ------------------------------------------------------------------ */
const CommunityGroup = ({
	communityTitle,
	subdomain,
	pubs,
}: {
	communityTitle: string;
	subdomain: string;
	pubs: ContentSearchPub[];
}) => {
	const [expanded, setExpanded] = useState(false);
	return (
		<div className={`cs-community-group${expanded ? ' expanded' : ''}`}>
			<button
				type="button"
				className="cs-community-group-header"
				onClick={() => setExpanded((v) => !v)}
			>
				<span className="cs-community-group-arrow">{expanded ? '▾' : '▸'}</span>
				<span className="cs-community-group-name">{communityTitle}</span>
				<Tag minimal round className="cs-community-group-count">
					{pubs.length}
				</Tag>
				<a
					href={`https://${subdomain}.pubpub.org`}
					target="_blank"
					rel="noopener noreferrer"
					className="cs-community-group-link"
					onClick={(e) => e.stopPropagation()}
				>
					↗
				</a>
			</button>
			{expanded && (
				<div className="cs-community-group-pubs">
					{pubs.map((pub) => (
						<PubCard key={pub.id} pub={pub} showCommunity={false} />
					))}
				</div>
			)}
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Detail panel                                                       */
/* ------------------------------------------------------------------ */
const ContentSearchDetail = ({
	name,
	pubCount,
	communityCount,
	pubsCache,
	loadingPubs,
	cacheKey,
	onLoadMore,
}: {
	name: string;
	pubCount: number;
	communityCount: number;
	pubsCache: Record<string, { pubs: ContentSearchPub[]; total: number }>;
	loadingPubs: string | null;
	cacheKey: string;
	onLoadMore: () => void;
}) => {
	const cached = pubsCache[cacheKey];
	const isLoading = loadingPubs === cacheKey;
	const [activeTab, setActiveTab] = useState<DetailTab>('pubs');
	const [pubSort, setPubSort] = useState<PubSortField>('relevance');
	const [pubSortDir, setPubSortDir] = useState<PubSortDir>('desc');

	const sortedPubs = useMemo(() => {
		if (!cached?.pubs) return [];
		if (pubSort === 'relevance') return cached.pubs;
		return [...cached.pubs].sort((a, b) => {
			const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
			const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
			return pubSortDir === 'desc' ? db - da : da - db;
		});
	}, [cached?.pubs, pubSort, pubSortDir]);

	const communityGroups = useMemo(() => {
		const groups = new Map<
			string,
			{ communityTitle: string; subdomain: string; pubs: ContentSearchPub[] }
		>();
		for (const pub of sortedPubs) {
			let group = groups.get(pub.communityId);
			if (!group) {
				group = {
					communityTitle: pub.communityTitle,
					subdomain: pub.communitySubdomain,
					pubs: [],
				};
				groups.set(pub.communityId, group);
			}
			group.pubs.push(pub);
		}
		return [...groups.values()].sort((a, b) => b.pubs.length - a.pubs.length);
	}, [sortedPubs]);

	const handlePubSort = useCallback(
		(field: PubSortField) => {
			if (pubSort === field) {
				setPubSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
			} else {
				setPubSort(field);
				setPubSortDir('desc');
			}
		},
		[pubSort],
	);

	const pubSortIcon = (field: PubSortField) => {
		if (pubSort !== field) return '';
		return pubSortDir === 'desc' ? ' ↓' : ' ↑';
	};

	const loadMoreButton = cached?.pubs && !isLoading && cached.pubs.length < cached.total && (
		<button type="button" className="cs-load-more-btn" onClick={onLoadMore}>
			Load more ({cached.pubs.length} of {cached.total})
		</button>
	);

	return (
		<>
			<div className="cs-detail-header">
				<h3>{name}</h3>
				<div className="cs-detail-header-meta">
					<Tag minimal>{plural(pubCount, 'pub')}</Tag>
					{communityCount > 0 && (
						<Tag minimal>{plural(communityCount, 'community', 'communities')}</Tag>
					)}
				</div>
			</div>

			<div className="cs-detail-toolbar">
				<Tabs
					id="cs-detail-tabs"
					selectedTabId={activeTab}
					onChange={(t: TabId) => setActiveTab(t as DetailTab)}
					className="cs-detail-tabs"
				>
					<Tab id="pubs" title="Pubs" />
					<Tab id="communities" title="Communities" />
				</Tabs>
				<div className="cs-detail-sort">
					<button
						type="button"
						className={pubSort === 'relevance' ? 'active' : ''}
						onClick={() => handlePubSort('relevance')}
					>
						Relevance{pubSortIcon('relevance')}
					</button>
					<button
						type="button"
						className={pubSort === 'date' ? 'active' : ''}
						onClick={() => handlePubSort('date')}
					>
						Date{pubSortIcon('date')}
					</button>
				</div>
			</div>

			{activeTab === 'pubs' && (
				<div className="cs-pub-list">
					{sortedPubs.map((pub) => (
						<PubCard key={pub.id} pub={pub} />
					))}
					{isLoading && (
						<div className="cs-detail-loading">
							<Spinner size={20} />
						</div>
					)}
					{loadMoreButton}
				</div>
			)}

			{activeTab === 'communities' && (
				<div className="cs-community-list">
					{communityGroups.map((group) => (
						<CommunityGroup
							key={group.subdomain}
							communityTitle={group.communityTitle}
							subdomain={group.subdomain}
							pubs={group.pubs}
						/>
					))}
					{isLoading && (
						<div className="cs-detail-loading">
							<Spinner size={20} />
						</div>
					)}
					{loadMoreButton}
					{cached?.pubs && cached.pubs.length < cached.total && (
						<div className="cs-community-load-note">
							Showing communities from the first {cached.pubs.length} of{' '}
							{cached.total} pubs. Load more pubs to see additional communities.
						</div>
					)}
				</div>
			)}
		</>
	);
};

/* ------------------------------------------------------------------ */
/* Skeleton primitives                                                */
/* ------------------------------------------------------------------ */
const SkeletonLine = ({
	width = '100%',
	height = 12,
}: {
	width?: string | number;
	height?: number;
}) => <span className="sk-line" style={{ width, height }} />;

const SkeletonBlock = ({
	width = '100%',
	height = 40,
}: {
	width?: string | number;
	height?: number;
}) => <span className="sk-block" style={{ width, height }} />;

const SidebarSkeleton = () => (
	<div className="cs-sidebar-list">
		{Array.from({ length: 14 }, (_, i) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
			<div key={i} className="cs-sidebar-item sk-sidebar-item">
				<SkeletonLine width={`${50 + (i % 3) * 15}%`} height={13} />
				<span className="cs-sidebar-counts">
					<SkeletonBlock width={28} height={18} />
				</span>
			</div>
		))}
	</div>
);

const DetailSkeleton = () => (
	<div className="cs-detail-skeleton">
		<div className="cs-detail-header">
			<SkeletonLine width={200} height={20} />
			<div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
				<SkeletonBlock width={80} height={20} />
				<SkeletonBlock width={100} height={20} />
			</div>
		</div>
		<div className="sk-detail-body">
			{Array.from({ length: 6 }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
				<div key={i} className="sk-pub-card">
					<SkeletonLine width="70%" height={14} />
					<SkeletonLine width="50%" height={11} />
					<SkeletonLine width="90%" height={11} />
				</div>
			))}
		</div>
	</div>
);

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */
type Props = {
	adhocPhrase: string;
	onAdhocPhraseChange: (phrase: string) => void;
};

const ContentSearchView = ({ adhocPhrase, onAdhocPhraseChange }: Props) => {
	const [terms, setTerms] = useState<ContentSearchSummary[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [sortField, setSortField] = useState<SortField>('pubCount');
	const [sortDir, setSortDir] = useState<SortDir>('desc');
	const [showFilter, setShowFilter] = useState<'all' | 'withPubs'>('withPubs');

	// Selected term + detail data
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const selectedRef = useRef<string | null>(null);
	const [pubsCache, setPubsCache] = useState<
		Record<string, { pubs: ContentSearchPub[]; total: number }>
	>({});
	const [loadingPubs, setLoadingPubs] = useState<string | null>(null);

	// Ad-hoc search state
	const [adhocInput, setAdhocInput] = useState(adhocPhrase);
	const [adhocResults, setAdhocResults] = useState<{
		pubs: ContentSearchPub[];
		total: number;
	} | null>(null);
	const [adhocLoading, setAdhocLoading] = useState(false);

	useEffect(() => {
		fetch('/api/superadmin/content-search')
			.then((r) => {
				if (!r.ok) throw new Error('Failed to load');
				return r.json();
			})
			.then((data: { terms: ContentSearchSummary[] }) => {
				setTerms(data.terms);
				setLoading(false);
			})
			.catch((err: any) => {
				setError(err?.message || 'Failed to load content search data');
				setLoading(false);
			});
	}, []);

	const loadTermPubs = useCallback(async (cacheKey: string, url: string, offset = 0) => {
		setLoadingPubs(cacheKey);
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error('Failed');
			const data: { pubs: ContentSearchPub[]; total: number } = await res.json();
			setPubsCache((prev) => {
				const existing = prev[cacheKey];
				if (existing && offset > 0) {
					return {
						...prev,
						[cacheKey]: {
							pubs: [...existing.pubs, ...data.pubs],
							total: data.total,
						},
					};
				}
				return { ...prev, [cacheKey]: data };
			});
		} finally {
			setLoadingPubs(null);
		}
	}, []);

	const handleSelectTerm = useCallback(
		(termIndex: number) => {
			const key = `term:${termIndex}`;
			selectedRef.current = key;
			setSelectedKey(key);
			if (!pubsCache[key]) {
				loadTermPubs(
					key,
					`/api/superadmin/content-search/${termIndex}/pubs?limit=50&offset=0`,
				);
			}
		},
		[pubsCache, loadTermPubs],
	);

	const handleLoadMore = useCallback(() => {
		if (!selectedKey) return;
		const existing = pubsCache[selectedKey];
		if (!existing) return;
		const offset = existing.pubs.length;

		if (selectedKey.startsWith('term:')) {
			const idx = selectedKey.replace('term:', '');
			loadTermPubs(
				selectedKey,
				`/api/superadmin/content-search/${idx}/pubs?limit=50&offset=${offset}`,
				offset,
			);
		} else if (selectedKey === 'adhoc') {
			loadTermPubs(
				selectedKey,
				`/api/superadmin/content-search/adhoc/pubs?q=${encodeURIComponent(adhocInput)}&limit=50&offset=${offset}`,
				offset,
			);
		}
	}, [selectedKey, pubsCache, loadTermPubs, adhocInput]);

	const handleAdhocSearch = useCallback(() => {
		const phrase = adhocInput.trim();
		if (!phrase) return;
		onAdhocPhraseChange(phrase);
		const key = 'adhoc';
		selectedRef.current = key;
		setSelectedKey(key);
		setAdhocLoading(true);
		fetch(
			`/api/superadmin/content-search/adhoc/pubs?q=${encodeURIComponent(phrase)}&limit=50&offset=0`,
		)
			.then((r) => r.json())
			.then((data: { pubs: ContentSearchPub[]; total: number }) => {
				setAdhocResults(data);
				setPubsCache((prev) => ({ ...prev, adhoc: data }));
				setAdhocLoading(false);
			})
			.catch(() => {
				setAdhocLoading(false);
			});
	}, [adhocInput, onAdhocPhraseChange]);

	const totalPubsMatched = useMemo(() => {
		if (!terms) return 0;
		return terms.reduce((sum, f) => sum + f.pubCount, 0);
	}, [terms]);

	const termsWithPubs = useMemo(() => {
		if (!terms) return 0;
		return terms.filter((f) => f.pubCount > 0).length;
	}, [terms]);

	const sorted = useMemo(() => {
		if (!terms) return [];
		let filtered = terms;

		if (searchTerm.trim()) {
			const q = searchTerm.toLowerCase();
			filtered = filtered.filter((f) => f.name.toLowerCase().includes(q));
		}

		if (showFilter === 'withPubs') {
			filtered = filtered.filter((f) => f.pubCount > 0);
		}

		return [...filtered].sort((a, b) => {
			const dir = sortDir === 'asc' ? 1 : -1;
			if (sortField === 'name') return dir * a.name.localeCompare(b.name);
			if (sortField === 'communityCount') return dir * (a.communityCount - b.communityCount);
			return dir * (a.pubCount - b.pubCount);
		});
	}, [terms, searchTerm, showFilter, sortField, sortDir]);

	const handleSort = useCallback(
		(field: SortField) => {
			if (sortField === field) {
				setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
			} else {
				setSortField(field);
				setSortDir(field === 'name' ? 'asc' : 'desc');
			}
		},
		[sortField],
	);

	const sortIcon = (field: SortField) => {
		if (sortField !== field) return ' ↕';
		return sortDir === 'desc' ? ' ↓' : ' ↑';
	};

	// Auto-select first term once loaded
	useEffect(() => {
		if (terms && selectedRef.current === null) {
			const withPubs = terms.filter((f) => f.pubCount > 0);
			const topTerm = [...withPubs].sort((a, b) => b.pubCount - a.pubCount)[0];
			if (topTerm) {
				handleSelectTerm(topTerm.index);
			}
		}
	}, [terms, handleSelectTerm]);

	const selectedTerm = useMemo(() => {
		if (!selectedKey || !terms) return null;
		if (selectedKey === 'adhoc') return null;
		const idx = parseInt(selectedKey.replace('term:', ''), 10);
		return terms.find((f) => f.index === idx) ?? null;
	}, [selectedKey, terms]);

	if (error) {
		return (
			<div className="cs-content-search">
				<div className="cs-error-message">Error: {error}</div>
			</div>
		);
	}

	return (
		<>
			{/* Header + stats */}
			<div className="cs-header">
				<div className="cs-stats-bar">
					{loading ? (
						<>
							<SkeletonBlock width={120} height={24} />
							<SkeletonBlock width={100} height={24} />
							<SkeletonBlock width={130} height={24} />
						</>
					) : (
						<>
							<Tag large minimal>
								{plural(terms?.length ?? 0, 'term')} tracked
							</Tag>
							<Tag large minimal>
								{termsWithPubs} with matches
							</Tag>
							<Tag large minimal>
								{formatNumber(totalPubsMatched)} total pub matches
							</Tag>
						</>
					)}
					<span className="cs-stats-spacer" />
					<select
						className="cs-filter-select"
						value={showFilter}
						onChange={(e) => setShowFilter(e.target.value as 'all' | 'withPubs')}
					>
						<option value="withPubs">With matches</option>
						<option value="all">All terms</option>
					</select>
				</div>
			</div>

			{/* Two-column layout */}
			<div className="cs-layout">
				{/* LEFT: term list */}
				<div className="cs-sidebar">
					{/* Ad-hoc search */}
					<div className="cs-adhoc-search">
						<InputGroup
							leftIcon="search"
							placeholder="Search any phrase…"
							value={adhocInput}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setAdhocInput(e.target.value)
							}
							onKeyDown={(e: React.KeyboardEvent) =>
								e.key === 'Enter' && handleAdhocSearch()
							}
							rightElement={
								<button
									type="button"
									className="bp3-button bp3-minimal bp3-intent-primary bp3-icon-arrow-right"
									onClick={handleAdhocSearch}
									disabled={!adhocInput.trim()}
								/>
							}
							small
						/>
					</div>

					<InputGroup
						leftIcon="filter"
						placeholder="Filter known terms…"
						value={searchTerm}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setSearchTerm(e.target.value)
						}
						className="cs-sidebar-search"
						small
					/>
					<div className="cs-sidebar-sort">
						<button
							type="button"
							className={sortField === 'pubCount' ? 'active' : ''}
							onClick={() => handleSort('pubCount')}
						>
							By pubs{sortField === 'pubCount' ? sortIcon('pubCount') : ''}
						</button>
						<button
							type="button"
							className={sortField === 'name' ? 'active' : ''}
							onClick={() => handleSort('name')}
						>
							By name{sortField === 'name' ? sortIcon('name') : ''}
						</button>
						<button
							type="button"
							className={sortField === 'communityCount' ? 'active' : ''}
							onClick={() => handleSort('communityCount')}
						>
							By communities
							{sortField === 'communityCount' ? sortIcon('communityCount') : ''}
						</button>
					</div>
					{loading ? (
						<SidebarSkeleton />
					) : (
						<div className="cs-sidebar-list">
							{sorted.map((f) => (
								<div
									key={f.index}
									className={`cs-sidebar-item${selectedKey === `term:${f.index}` ? ' selected' : ''}${f.pubCount === 0 ? ' no-pubs' : ''}`}
									onClick={() => f.pubCount > 0 && handleSelectTerm(f.index)}
									role="button"
									tabIndex={f.pubCount > 0 ? 0 : -1}
									onKeyDown={(e) =>
										e.key === 'Enter' &&
										f.pubCount > 0 &&
										handleSelectTerm(f.index)
									}
								>
									<span className="cs-sidebar-name">{f.name}</span>
									<span className="cs-sidebar-counts">
										<Tag minimal round title="Pubs">
											{formatNumber(f.pubCount)}
										</Tag>
									</span>
								</div>
							))}
							{sorted.length === 0 && (
								<div className="cs-sidebar-empty">No matches</div>
							)}
						</div>
					)}
				</div>

				{/* RIGHT: detail panel */}
				<div className="cs-detail">
					{loading && <DetailSkeleton />}
					{!loading && adhocLoading && (
						<div className="cs-detail-loading">
							<Spinner size={30} />
						</div>
					)}
					{!loading && !adhocLoading && selectedKey === 'adhoc' && adhocResults ? (
						<ContentSearchDetail
							name={`"${adhocInput}"`}
							pubCount={adhocResults.total}
							communityCount={0}
							pubsCache={pubsCache}
							loadingPubs={loadingPubs}
							cacheKey="adhoc"
							onLoadMore={handleLoadMore}
						/>
					) : !loading && !adhocLoading && selectedTerm ? (
						<ContentSearchDetail
							name={selectedTerm.name}
							pubCount={selectedTerm.pubCount}
							communityCount={selectedTerm.communityCount}
							pubsCache={pubsCache}
							loadingPubs={loadingPubs}
							cacheKey={`term:${selectedTerm.index}`}
							onLoadMore={handleLoadMore}
						/>
					) : !loading && !adhocLoading ? (
						<NonIdealState
							icon="search"
							title="Select a term"
							description="Choose a term from the list or search any phrase."
						/>
					) : null}
				</div>
			</div>
		</>
	);
};

export default ContentSearchView;
