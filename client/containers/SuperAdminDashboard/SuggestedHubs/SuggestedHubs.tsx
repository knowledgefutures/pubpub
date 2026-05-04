import type {
	ActivityEvent,
	EduCollaborator,
	EduCommunity,
	EduDomainGroup,
	EduDomainSummary,
	EduPerson,
} from 'server/community/eduQueries';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Button,
	ButtonGroup,
	InputGroup,
	Intent,
	NonIdealState,
	Spinner,
	Tab,
	Tabs,
	Tag,
} from '@blueprintjs/core';

import ContentSearchView from './ContentSearchView';

import './suggestedHubs.scss';

type SuggestedHubsMode = 'domain' | 'content';

type Props = {
	domainSummaries?: EduDomainSummary[];
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

const SK_SIDEBAR_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
const SK_SIDEBAR_WIDTHS = [55, 70, 85, 55, 70, 85, 55, 70, 85, 55, 70, 85];

/** Sidebar skeleton: 12 placeholder rows */
const SidebarSkeleton = () => (
	<div className="edu-sidebar-list">
		{SK_SIDEBAR_KEYS.map((k, i) => (
			<div key={k} className="edu-sidebar-item sk-sidebar-item">
				<SkeletonLine width={18} height={11} />
				<SkeletonLine width={`${SK_SIDEBAR_WIDTHS[i]}%`} height={13} />
				<span className="edu-sidebar-counts">
					<SkeletonBlock width={28} height={18} />
					<SkeletonBlock width={24} height={18} />
				</span>
			</div>
		))}
	</div>
);

/** Stats bar skeleton: 4 stat tag placeholders */
const StatsBarSkeleton = () => (
	<div className="edu-stats-bar">
		<SkeletonBlock width={120} height={24} />
		<SkeletonBlock width={100} height={24} />
		<SkeletonBlock width={130} height={24} />
		<SkeletonBlock width={150} height={24} />
	</div>
);

/** Detail panel skeleton: header + tab bar + content area */
const DetailSkeleton = () => (
	<div className="edu-detail-skeleton">
		<div className="edu-detail-header">
			<SkeletonLine width={180} height={20} />
			<div
				className="edu-detail-header-meta"
				style={{ display: 'flex', gap: 6, marginTop: 6 }}
			>
				<SkeletonBlock width={80} height={20} />
				<SkeletonBlock width={60} height={20} />
				<SkeletonBlock width={100} height={20} />
			</div>
		</div>
		<div style={{ display: 'flex', gap: 16, marginTop: 16, marginBottom: 16 }}>
			{['Overview', 'Communities', 'People', 'Collaborators', 'Activity'].map((t) => (
				<SkeletonBlock key={t} width={70} height={14} />
			))}
		</div>
		<div className="sk-detail-body">
			<div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
				{[1, 2, 3, 4].map((n) => (
					<SkeletonBlock key={n} width="25%" height={56} />
				))}
			</div>
			{[1, 2, 3].map((n) => (
				<div key={n} style={{ marginBottom: 12 }}>
					<SkeletonLine width={120} height={14} />
					<div style={{ marginTop: 6 }}>
						{[1, 2, 3].map((r) => (
							<SkeletonLine key={r} width={`${70 + r * 8}%`} height={12} />
						))}
					</div>
				</div>
			))}
		</div>
	</div>
);

/** Tab-level skeleton for lazy tabs (collaborators, activity) */
const TabSkeleton = () => (
	<div className="edu-tab-content sk-tab-skeleton">
		<div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
			{[1, 2, 3, 4].map((n) => (
				<SkeletonBlock key={n} width="25%" height={48} />
			))}
		</div>
		<SkeletonBlock width="100%" height={60} />
		<div style={{ marginTop: 12 }}>
			{['r1', 'r2', 'r3', 'r4', 'r5', 'r6'].map((k) => (
				<div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
					<SkeletonLine width={70} height={11} />
					<SkeletonLine width={60} height={11} />
					<SkeletonLine width={100} height={11} />
					<SkeletonLine width="40%" height={11} />
					<SkeletonLine width={80} height={11} />
				</div>
			))}
		</div>
	</div>
);

const formatDate = (d: string) =>
	new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

const plural = (n: number, w: string, p?: string) => `${n} ${n === 1 ? w : p || w + 's'}`;

/* ------------------------------------------------------------------ */
/* Detail: Communities tab                                            */
/* ------------------------------------------------------------------ */
const CommunitiesTab = ({ group }: { group: EduDomainGroup }) => (
	<div className="edu-tab-content">
		<div className="edu-tab-summary">
			<Tag minimal intent={Intent.PRIMARY}>
				{plural(group.communityAdminCount, 'admin-led community', 'admin-led communities')}
			</Tag>
			<Tag minimal intent={Intent.SUCCESS}>
				{plural(group.communityAuthorCount, 'community', 'communities')} with authors
			</Tag>
			<Tag minimal>{plural(group.authoredPubCount, 'pub')} authored</Tag>
		</div>
		{group.communities.map((comm) => (
			<CommunityCard key={comm.communityId} comm={comm} />
		))}
	</div>
);

const AUTHOR_LIMIT = 5;

const CommunityCard = ({ comm }: { comm: EduCommunity }) => {
	const [showAllAuthors, setShowAllAuthors] = useState(false);
	const visibleAuthors = showAllAuthors ? comm.authors : comm.authors.slice(0, AUTHOR_LIMIT);
	const hiddenCount = comm.authors.length - AUTHOR_LIMIT;

	return (
		<div className="edu-comm-card">
			<div className="edu-comm-card-top">
				{comm.communityAvatar && (
					<img src={comm.communityAvatar} alt="" className="edu-comm-avatar" />
				)}
				<div className="edu-comm-info">
					<a
						href={`https://${comm.communitySubdomain}.pubpub.org`}
						target="_blank"
						rel="noopener noreferrer"
						className="edu-comm-title"
					>
						{comm.communityTitle}
					</a>
					<span className="edu-comm-sub">{comm.communitySubdomain}.pubpub.org</span>
				</div>
				<div className="edu-comm-nums">
					<Tag minimal>{plural(comm.pubCount, 'pub')}</Tag>
					<Tag minimal>{plural(comm.totalMembers, 'member')}</Tag>
					<span className="edu-comm-date">
						Est. {formatDate(comm.communityCreatedAt)}
					</span>
				</div>
			</div>
			{comm.communityDescription && (
				<p className="edu-comm-desc">{comm.communityDescription}</p>
			)}
			<div className="edu-comm-people-row">
				{comm.admins.length > 0 && (
					<div className="edu-comm-people-group">
						<span className="edu-comm-people-label">Admins:</span>
						{comm.admins.map((a) => (
							<span key={a.userId} className="edu-person-chip">
								{a.avatar ? (
									<img src={a.avatar} alt="" className="edu-chip-avatar" />
								) : (
									<span className="edu-chip-avatar-ph">
										{a.fullName.charAt(0)}
									</span>
								)}
								<span className="edu-chip-name">{a.fullName}</span>
							</span>
						))}
					</div>
				)}
				{comm.authors.length > 0 && (
					<div className="edu-comm-people-group">
						<span className="edu-comm-people-label">Authors:</span>
						{visibleAuthors.map((a) => (
							<span key={a.userId} className="edu-person-chip">
								{a.avatar ? (
									<img src={a.avatar} alt="" className="edu-chip-avatar" />
								) : (
									<span className="edu-chip-avatar-ph">
										{a.fullName.charAt(0)}
									</span>
								)}
								<span className="edu-chip-name">{a.fullName}</span>
							</span>
						))}
						{hiddenCount > 0 && (
							<button
								type="button"
								className="edu-show-more-btn"
								onClick={() => setShowAllAuthors(!showAllAuthors)}
							>
								{showAllAuthors ? 'show less' : `+${hiddenCount} more`}
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Detail: People tab                                                 */
/* ------------------------------------------------------------------ */
type PeopleSortKey = 'activity' | 'name' | 'pubs' | 'discussions' | 'reviews' | 'adminIn';
type SortDir = 'desc' | 'asc';

const personSortAccessor = (p: EduPerson, key: PeopleSortKey): number | string => {
	switch (key) {
		case 'name':
			return p.fullName.toLowerCase();
		case 'pubs':
			return p.authoredPubCount;
		case 'discussions':
			return p.discussionCount;
		case 'reviews':
			return p.reviewCount;
		case 'adminIn':
			return p.adminCommunityCount;
		case 'activity':
		default:
			return p.authoredPubCount + p.discussionCount + p.reviewCount + p.adminCommunityCount;
	}
};

const PeopleTab = ({ group }: { group: EduDomainGroup }) => {
	// null = composite default, otherwise a specific column + direction
	const [sortKey, setSortKey] = useState<PeopleSortKey | null>(null);
	const [sortDir, setSortDir] = useState<SortDir>('desc');

	const sortedPeople = useMemo(() => {
		const activeKey = sortKey ?? 'activity';
		const activeDir = sortKey ? sortDir : 'desc';
		return [...group.people].sort((a, b) => {
			const aVal = personSortAccessor(a, activeKey);
			const bVal = personSortAccessor(b, activeKey);
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return activeDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			}
			return activeDir === 'asc'
				? (aVal as number) - (bVal as number)
				: (bVal as number) - (aVal as number);
		});
	}, [group.people, sortKey, sortDir]);

	// Three-state cycle: first click → desc, second → asc, third → off (composite)
	const handleSort = (key: PeopleSortKey) => {
		if (sortKey !== key) {
			// Fresh column: start descending (or ascending for name)
			setSortKey(key);
			setSortDir(key === 'name' ? 'asc' : 'desc');
		} else if (key === 'name' ? sortDir === 'asc' : sortDir === 'desc') {
			// Currently in first state → flip direction
			setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
		} else {
			// Currently in second state → back to composite
			setSortKey(null);
			setSortDir('desc');
		}
	};

	const sortIndicator = (key: PeopleSortKey) => {
		if (sortKey !== key) return null;
		return <span className="edu-sort-arrow">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
	};

	return (
		<div className="edu-tab-content">
			<div className="edu-tab-summary">
				<Tag minimal intent={Intent.PRIMARY}>
					{plural(group.adminCount, 'admin')}
				</Tag>
				<Tag minimal intent={Intent.SUCCESS}>
					{plural(group.authorCount, 'author')}
				</Tag>
				<Tag minimal intent={Intent.WARNING}>
					{plural(group.reviewerCount, 'reviewer')}
				</Tag>
				<Tag minimal>{plural(group.commenterCount, 'commenter')}</Tag>
			</div>
			<table className="edu-people-table">
				<thead>
					<tr>
						<th>#</th>
						<th
							className={`edu-sortable-th${sortKey === 'name' ? ' edu-sorted' : ''}`}
							onClick={() => handleSort('name')}
						>
							Name {sortIndicator('name')}
						</th>
						<th>Roles</th>
						{(['pubs', 'discussions', 'reviews', 'adminIn'] as const).map((key) => {
							const labels: Record<string, string> = {
								pubs: 'Pubs',
								discussions: 'Discussions',
								reviews: 'Reviews',
								adminIn: 'Admin In',
							};
							return (
								<th
									key={key}
									className={`edu-sortable-th${sortKey === key ? ' edu-sorted' : ''}`}
									onClick={() => handleSort(key)}
								>
									{labels[key]} {sortIndicator(key)}
								</th>
							);
						})}
						<th>ORCID</th>
					</tr>
				</thead>
				<tbody>
					{sortedPeople.map((person, idx) => (
						<tr key={person.userId}>
							<td className="edu-rank-cell">{idx + 1}</td>
							<td>
								<div className="edu-person-name-cell">
									{person.avatar ? (
										<img
											src={person.avatar}
											alt=""
											className="edu-person-avatar"
										/>
									) : (
										<span className="edu-person-avatar-ph">
											{person.fullName.charAt(0)}
										</span>
									)}
									{person.fullName}
								</div>
							</td>
							<td>
								<div className="edu-roles-cell">
									{person.roles.map((r) => (
										<Tag
											key={r}
											minimal
											round
											intent={
												r === 'admin'
													? Intent.PRIMARY
													: r === 'author'
														? Intent.SUCCESS
														: r === 'reviewer'
															? Intent.WARNING
															: Intent.NONE
											}
										>
											{r}
										</Tag>
									))}
								</div>
							</td>
							<td>{person.authoredPubCount || <span className="edu-dim">—</span>}</td>
							<td>{person.discussionCount || <span className="edu-dim">—</span>}</td>
							<td>{person.reviewCount || <span className="edu-dim">—</span>}</td>
							<td>
								{person.adminCommunityCount || <span className="edu-dim">—</span>}
							</td>
							<td>
								{person.orcid ? (
									<a
										href={`https://orcid.org/${person.orcid}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										{person.orcid}
									</a>
								) : (
									<span className="edu-dim">—</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Detail: Overview tab (provost pitch)                               */
/* ------------------------------------------------------------------ */
const OverviewTab = ({ group }: { group: EduDomainGroup }) => {
	const topAuthors = group.people.filter((p) => p.authoredPubCount > 0).slice(0, 5);
	const topAdmins = group.people.filter((p) => p.roles.includes('admin')).slice(0, 5);
	const biggestCommunities = [...group.communities]
		.sort((a, b) => b.pubCount - a.pubCount)
		.slice(0, 5);

	return (
		<div className="edu-tab-content edu-overview">
			<div className="edu-overview-grid">
				<div className="edu-overview-stat-card">
					<span className="edu-overview-stat-num">{group.totalPeopleCount}</span>
					<span className="edu-overview-stat-label">People on PubPub</span>
				</div>
				<div className="edu-overview-stat-card">
					<span className="edu-overview-stat-num">{group.authoredPubCount}</span>
					<span className="edu-overview-stat-label">Publications Authored</span>
				</div>
				<div className="edu-overview-stat-card">
					<span className="edu-overview-stat-num">{group.communities.length}</span>
					<span className="edu-overview-stat-label">Communities Involved</span>
				</div>
				<div className="edu-overview-stat-card">
					<span className="edu-overview-stat-num">{group.communityAdminCount}</span>
					<span className="edu-overview-stat-label">Communities Administered</span>
				</div>
			</div>

			{topAuthors.length > 0 && (
				<div className="edu-overview-section">
					<h4>Top Authors</h4>
					<div className="edu-overview-list">
						{topAuthors.map((p, i) => (
							<div key={p.userId} className="edu-overview-row">
								<span className="edu-overview-rank">{i + 1}</span>
								{p.avatar ? (
									<img src={p.avatar} alt="" className="edu-person-avatar" />
								) : (
									<span className="edu-person-avatar-ph">
										{p.fullName.charAt(0)}
									</span>
								)}
								<span className="edu-overview-name">{p.fullName}</span>
								<span className="edu-overview-value">
									{plural(p.authoredPubCount, 'pub')}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{topAdmins.length > 0 && (
				<div className="edu-overview-section">
					<h4>Key Contacts (Admins)</h4>
					<div className="edu-overview-list">
						{topAdmins.map((p, i) => (
							<div key={p.userId} className="edu-overview-row">
								<span className="edu-overview-rank">{i + 1}</span>
								{p.avatar ? (
									<img src={p.avatar} alt="" className="edu-person-avatar" />
								) : (
									<span className="edu-person-avatar-ph">
										{p.fullName.charAt(0)}
									</span>
								)}
								<span className="edu-overview-name">{p.fullName}</span>
								<span className="edu-overview-role">Admin</span>
							</div>
						))}
					</div>
				</div>
			)}

			{biggestCommunities.length > 0 && (
				<div className="edu-overview-section">
					<h4>Biggest Communities</h4>
					<div className="edu-overview-list">
						{biggestCommunities.map((c, i) => (
							<div key={c.communityId} className="edu-overview-row">
								<span className="edu-overview-rank">{i + 1}</span>
								{c.communityAvatar && (
									<img
										src={c.communityAvatar}
										alt=""
										className="edu-comm-avatar-sm"
									/>
								)}
								<a
									href={`https://${c.communitySubdomain}.pubpub.org`}
									target="_blank"
									rel="noopener noreferrer"
									className="edu-overview-name"
								>
									{c.communityTitle}
								</a>
								<span className="edu-overview-value">
									{plural(c.pubCount, 'pub')}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Detail: Content Mentions tab (cross-reference)                    */
/* ------------------------------------------------------------------ */
type ContentMention = { index: number; name: string; pubCount: number };

const ContentMentionsTab = ({ domain }: { domain: string }) => {
	const [mentions, setMentions] = useState<ContentMention[] | null>(null);
	const [loading, setLoading] = useState(false);
	const cacheRef = useRef<Record<string, ContentMention[]>>({});

	useEffect(() => {
		if (cacheRef.current[domain]) {
			setMentions(cacheRef.current[domain]);
			return;
		}
		let cancelled = false;
		setLoading(true);
		fetch(`/api/superadmin/suggested-hubs/${encodeURIComponent(domain)}/content-mentions`)
			.then((r) => (r.ok ? r.json() : []))
			.then((data: ContentMention[]) => {
				if (cancelled) return;
				cacheRef.current[domain] = data;
				setMentions(data);
				setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [domain]);

	if (loading || mentions === null) {
		return (
			<div className="edu-tab-content">
				<div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
					<Spinner size={24} />
				</div>
			</div>
		);
	}

	if (mentions.length === 0) {
		return (
			<div className="edu-tab-content">
				<NonIdealState
					icon="search"
					title="No content matches"
					description={`No known search terms found in pubs authored by people at ${domain}.`}
				/>
			</div>
		);
	}

	const totalPubs = mentions.reduce((s, m) => s + m.pubCount, 0);

	return (
		<div className="edu-tab-content">
			<div className="edu-tab-summary">
				<Tag minimal intent={Intent.PRIMARY}>
					{plural(mentions.length, 'term')} mentioned
				</Tag>
				<Tag minimal intent={Intent.SUCCESS}>
					{plural(totalPubs, 'pub')} with mentions
				</Tag>
			</div>
			<table className="edu-people-table">
				<thead>
					<tr>
						<th>#</th>
						<th>Term</th>
						<th>Pubs</th>
					</tr>
				</thead>
				<tbody>
					{mentions.map((m, idx) => (
						<tr key={m.index}>
							<td className="edu-rank-cell">{idx + 1}</td>
							<td>
								<strong>{m.name}</strong>
							</td>
							<td>{m.pubCount}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Detail: Collaborators tab                                         */
/* ------------------------------------------------------------------ */
const CollaboratorsTab = ({ domain }: { domain: string }) => {
	const [collaborators, setCollaborators] = useState<EduCollaborator[] | null>(null);
	const [loading, setLoading] = useState(false);
	const cacheRef = useRef<Record<string, EduCollaborator[]>>({});

	useEffect(() => {
		const key = domain;
		if (cacheRef.current[key]) {
			setCollaborators(cacheRef.current[key]);
			return;
		}
		let cancelled = false;
		setLoading(true);
		fetch(`/api/superadmin/suggested-hubs/${encodeURIComponent(domain)}/collaborators`)
			.then((r) => (r.ok ? r.json() : []))
			.then((data: EduCollaborator[]) => {
				if (cancelled) return;
				cacheRef.current[key] = data;
				setCollaborators(data);
				setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [domain]);

	if (loading || collaborators === null) {
		return <TabSkeleton />;
	}

	if (collaborators.length === 0) {
		return (
			<div className="edu-tab-content">
				<NonIdealState
					icon="exchange"
					title="No cross-institution collaborators"
					description={`No co-authored pubs found linking ${domain} to other academic institutions.`}
				/>
			</div>
		);
	}

	const totalSharedPubs = collaborators.reduce((s, c) => s + c.sharedPubCount, 0);
	const totalCollaborators = collaborators.reduce((s, c) => s + c.collaboratorCount, 0);

	return (
		<div className="edu-tab-content">
			<div className="edu-tab-summary">
				<Tag minimal intent={Intent.PRIMARY}>
					{plural(collaborators.length, 'partner institution')}
				</Tag>
				<Tag minimal intent={Intent.SUCCESS}>
					{plural(totalSharedPubs, 'co-authored pub')}
				</Tag>
				<Tag minimal>{plural(totalCollaborators, 'external collaborator')}</Tag>
			</div>
			<table className="edu-people-table">
				<thead>
					<tr>
						<th>#</th>
						<th>Institution Domain</th>
						<th>Shared Pubs</th>
						<th>Collaborators</th>
					</tr>
				</thead>
				<tbody>
					{collaborators.map((c, idx) => (
						<tr key={c.collaboratorDomain}>
							<td className="edu-rank-cell">{idx + 1}</td>
							<td>
								<strong>{c.collaboratorDomain}</strong>
							</td>
							<td>{c.sharedPubCount}</td>
							<td>{c.collaboratorCount}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Detail: Activity tab (dense analytics log)                        */
/* ------------------------------------------------------------------ */

type ActivityKind = 'release' | 'community' | 'discussion' | 'review';

const EVENT_META: Record<ActivityKind, { color: string; label: string; intent: Intent }> = {
	release: { color: '#1c6ef3', label: 'Release', intent: Intent.PRIMARY },
	community: { color: '#7c3aed', label: 'Community', intent: Intent.NONE },
	discussion: { color: '#0d9488', label: 'Discussion', intent: Intent.SUCCESS },
	review: { color: '#d97706', label: 'Review', intent: Intent.WARNING },
};

const ALL_KINDS: ActivityKind[] = ['release', 'community', 'discussion', 'review'];

const shortTimestamp = (ts: string) => {
	const d = new Date(ts);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / 86400000);
	const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	if (diffDays === 0) return time;
	if (diffDays === 1) return `Yesterday ${time}`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Build compact description string for the event log */
const eventDescription = (ev: ActivityEvent) => {
	switch (ev.kind) {
		case 'release':
			return `Released "${ev.pubTitle || 'Untitled'}"${ev.releaseNoteText ? ` — ${ev.releaseNoteText}` : ''}`;
		case 'community':
			return `Community "${ev.communityTitle}" created`;
		case 'discussion':
			return `Discussion${ev.discussionTitle ? ` "${ev.discussionTitle}"` : ''} on "${ev.pubTitle || 'Untitled'}"`;
		case 'review':
			return `Review${ev.reviewStatus === 'completed' ? ' (completed)' : ''}${ev.reviewTitle ? ` "${ev.reviewTitle}"` : ''} on "${ev.pubTitle || 'Untitled'}"`;
		default:
			return '';
	}
};

/** Compute monthly histogram from events for the last 12 months */
const buildMonthlyBuckets = (events: ActivityEvent[]) => {
	const now = new Date();
	const months: { key: string; label: string; counts: Record<ActivityKind, number> }[] = [];
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		const label = d.toLocaleDateString('en-US', { month: 'short' });
		months.push({ key, label, counts: { release: 0, community: 0, discussion: 0, review: 0 } });
	}
	const monthMap = new Map(months.map((m) => [m.key, m]));
	for (const ev of events) {
		const d = new Date(ev.timestamp);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		const bucket = monthMap.get(key);
		if (bucket && (ev.kind as ActivityKind) in bucket.counts) {
			bucket.counts[ev.kind as ActivityKind]++;
		}
	}
	return months;
};

const ActivityTab = ({ domain }: { domain: string }) => {
	const [events, setEvents] = useState<ActivityEvent[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [kindFilter, setKindFilter] = useState<Set<ActivityKind>>(new Set(ALL_KINDS));
	const cacheRef = useRef<Record<string, ActivityEvent[]>>({});

	useEffect(() => {
		const key = domain;
		if (cacheRef.current[key]) {
			setEvents(cacheRef.current[key]);
			return;
		}
		let cancelled = false;
		setLoading(true);
		fetch(`/api/superadmin/suggested-hubs/${encodeURIComponent(domain)}/activity`)
			.then((r) => (r.ok ? r.json() : []))
			.then((data: ActivityEvent[]) => {
				if (cancelled) return;
				cacheRef.current[key] = data;
				setEvents(data);
				setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [domain]);

	if (loading || events === null) {
		return <TabSkeleton />;
	}

	if (events.length === 0) {
		return (
			<div className="edu-tab-content">
				<NonIdealState
					icon="timeline-events"
					title="No recent activity"
					description={`No activity found for ${domain}.`}
				/>
			</div>
		);
	}

	// Compute counts by kind
	const counts: Record<ActivityKind, number> = {
		release: 0,
		community: 0,
		discussion: 0,
		review: 0,
	};
	for (const ev of events) {
		if ((ev.kind as ActivityKind) in counts) counts[ev.kind as ActivityKind]++;
	}

	// Monthly histogram
	const monthlyBuckets = buildMonthlyBuckets(events);
	const maxMonthTotal = Math.max(
		1,
		...monthlyBuckets.map((m) => ALL_KINDS.reduce((s, k) => s + m.counts[k], 0)),
	);

	// Filtered events
	const filtered = events.filter((ev) => kindFilter.has(ev.kind as ActivityKind));

	const toggleKind = (k: ActivityKind) => {
		setKindFilter((prev) => {
			const next = new Set(prev);
			if (next.has(k)) {
				if (next.size > 1) next.delete(k);
			} else {
				next.add(k);
			}
			return next;
		});
	};

	const showAll = kindFilter.size === ALL_KINDS.length;

	return (
		<div className="edu-tab-content activity-dashboard">
			{/* ---- Stat cards ---- */}
			<div className="activity-stats-row">
				{ALL_KINDS.map((k) => {
					const meta = EVENT_META[k];
					return (
						<button
							key={k}
							type="button"
							className={`activity-stat-card ${kindFilter.has(k) ? 'active' : 'muted'}`}
							onClick={() => toggleKind(k)}
							style={{ borderTopColor: meta.color }}
						>
							<span
								className="activity-stat-num"
								style={{ color: kindFilter.has(k) ? meta.color : undefined }}
							>
								{counts[k]}
							</span>
							<span className="activity-stat-label">{meta.label}s</span>
						</button>
					);
				})}
			</div>

			{/* ---- Monthly histogram ---- */}
			<div className="activity-histogram">
				<div className="activity-histogram-label">Activity — last 12 months</div>
				<div className="activity-histogram-bars">
					{monthlyBuckets.map((m) => {
						const total = ALL_KINDS.reduce((s, k) => s + m.counts[k], 0);
						return (
							<div
								key={m.key}
								className="activity-histogram-col"
								title={`${m.label}: ${total} events`}
							>
								<div
									className="activity-histogram-stack"
									style={{
										height: `${Math.round((total / maxMonthTotal) * 40)}px`,
									}}
								>
									{ALL_KINDS.map((k) => {
										const h =
											total > 0 ? Math.round((m.counts[k] / total) * 100) : 0;
										if (h === 0) return null;
										return (
											<span
												key={k}
												style={{
													flex: `0 0 ${h}%`,
													background: EVENT_META[k].color,
												}}
											/>
										);
									})}
								</div>
								<span className="activity-histogram-month">{m.label}</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* ---- Filter bar ---- */}
			<div className="activity-filter-bar">
				<button
					type="button"
					className={`activity-filter-btn ${showAll ? 'active' : ''}`}
					onClick={() => setKindFilter(new Set(ALL_KINDS))}
				>
					All ({events.length})
				</button>
				{ALL_KINDS.map((k) => (
					<button
						key={k}
						type="button"
						className={`activity-filter-btn ${kindFilter.has(k) && !showAll ? 'active' : ''}`}
						onClick={() => setKindFilter(new Set([k]))}
						style={
							kindFilter.has(k) && !showAll
								? {
										borderBottomColor: EVENT_META[k].color,
										color: EVENT_META[k].color,
									}
								: undefined
						}
					>
						{EVENT_META[k].label}s ({counts[k]})
					</button>
				))}
			</div>

			{/* ---- Dense event log table ---- */}
			<div className="activity-log-wrap">
				<table className="activity-log-table">
					<thead>
						<tr>
							<th className="al-col-time">When</th>
							<th className="al-col-type">Type</th>
							<th className="al-col-actor">Who</th>
							<th className="al-col-desc">What</th>
							<th className="al-col-comm">Community</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((ev, i) => {
							const meta = EVENT_META[ev.kind as ActivityKind] || EVENT_META.release;
							const communityUrl = `https://${ev.communitySubdomain}.pubpub.org`;
							const pubUrl = ev.pubSlug ? `${communityUrl}/pub/${ev.pubSlug}` : null;
							return (
								<tr key={`${ev.kind}-${ev.timestamp}-${i}`}>
									<td className="al-col-time">{shortTimestamp(ev.timestamp)}</td>
									<td className="al-col-type">
										<span
											className="al-type-dot"
											style={{ background: meta.color }}
										/>
										{meta.label}
									</td>
									<td className="al-col-actor" title={ev.actorName}>
										{ev.actorName}
									</td>
									<td className="al-col-desc">
										{ev.kind === 'community' ? (
											<a
												href={communityUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												{eventDescription(ev)}
											</a>
										) : pubUrl ? (
											<a
												href={pubUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												{eventDescription(ev)}
											</a>
										) : (
											eventDescription(ev)
										)}
									</td>
									<td className="al-col-comm">
										<a
											href={communityUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											{ev.communitySubdomain}
										</a>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

/** Cache key: domain → data */
type DetailCache = Record<string, EduDomainGroup | null>;

const fetchDomainDetail = async (domain: string): Promise<EduDomainGroup | null> => {
	const res = await fetch(`/api/superadmin/suggested-hubs/${encodeURIComponent(domain)}`);
	if (!res.ok) return null;
	return res.json();
};

const fetchSummaries = async (): Promise<EduDomainSummary[]> => {
	const res = await fetch('/api/superadmin/suggested-hubs-summaries');
	if (!res.ok) return [];
	return res.json();
};

const SuggestedHubs = (props: Props) => {
	const { domainSummaries: initialSummaries } = props;
	const [mode, setMode] = useState<SuggestedHubsMode>('domain');
	const [summaries, setSummaries] = useState<EduDomainSummary[]>(initialSummaries ?? []);
	const [summariesLoading, setSummariesLoading] = useState(
		!initialSummaries || initialSummaries.length === 0,
	);
	const [domainSearch, setDomainSearch] = useState('');
	const [adhocDomain, setAdhocDomain] = useState('');
	const [adhocPhrase, setAdhocPhrase] = useState('');
	const [selectedDomain, setSelectedDomain] = useState<string | null>(
		initialSummaries && initialSummaries.length > 0 ? initialSummaries[0].domain : null,
	);
	const [activeGroup, setActiveGroup] = useState<EduDomainGroup | null>(null);
	const [loading, setLoading] = useState(false);
	const cacheRef = useRef<DetailCache>({});
	const summariesCacheRef = useRef<Record<string, EduDomainSummary[]>>({});

	// Fetch summaries on mount
	const initialSummariesRef = useRef(initialSummaries);
	initialSummariesRef.current = initialSummaries;
	const selectedDomainRef = useRef(selectedDomain);
	selectedDomainRef.current = selectedDomain;

	useEffect(() => {
		if (summariesCacheRef.current.loaded) {
			const cached = summariesCacheRef.current.loaded;
			setSummaries(cached);
			setSummariesLoading(false);
			if (!selectedDomainRef.current && cached.length > 0) {
				setSelectedDomain(cached[0].domain);
			}
			return;
		}
		const ssrData = initialSummariesRef.current;
		if (ssrData && ssrData.length > 0) {
			summariesCacheRef.current.loaded = ssrData;
			setSummaries(ssrData);
			setSummariesLoading(false);
			if (!selectedDomainRef.current) setSelectedDomain(ssrData[0].domain);
			return;
		}
		let cancelled = false;
		setSummariesLoading(true);
		fetchSummaries().then((data) => {
			if (cancelled) return;
			summariesCacheRef.current.loaded = data;
			setSummaries(data);
			setSummariesLoading(false);
			if (!selectedDomainRef.current && data.length > 0) {
				setSelectedDomain(data[0].domain);
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const filteredDomains = useMemo(() => {
		if (!domainSearch.trim()) return summaries;
		const q = domainSearch.toLowerCase();
		return summaries.filter((g) => g.domain.toLowerCase().includes(q));
	}, [summaries, domainSearch]);

	// Fetch detail when selectedDomain changes
	const loadDetail = useCallback(async (domain: string | null) => {
		if (!domain) {
			setActiveGroup(null);
			return;
		}
		if (cacheRef.current[domain] !== undefined) {
			setActiveGroup(cacheRef.current[domain]);
			return;
		}
		setLoading(true);
		const group = await fetchDomainDetail(domain);
		cacheRef.current[domain] = group;
		setActiveGroup(group);
		setLoading(false);
	}, []);

	useEffect(() => {
		loadDetail(selectedDomain);
	}, [selectedDomain, loadDetail]);

	const totalPeople = summaries.reduce((s, g) => s + g.totalPeopleCount, 0);
	const totalPubs = summaries.reduce((s, g) => s + g.authoredPubCount, 0);
	const totalComms = summaries.reduce((s, g) => s + g.communityCount, 0);

	// Ad-hoc domain lookup: fetch detail directly by domain string
	const handleAdhocDomainSearch = useCallback(() => {
		const d = adhocDomain.trim().toLowerCase();
		if (!d) return;
		setSelectedDomain(d);
	}, [adhocDomain]);

	return (
		<div className="suggested-hubs-component">
			<div className="edu-header">
				<h2>Suggested Hubs</h2>
				<div className="edu-mode-toggle">
					<ButtonGroup>
						<Button
							text="By Domain"
							active={mode === 'domain'}
							onClick={() => setMode('domain')}
							icon="globe-network"
							small
						/>
						<Button
							text="By Content"
							active={mode === 'content'}
							onClick={() => setMode('content')}
							icon="search-text"
							small
						/>
					</ButtonGroup>
				</div>
			</div>
			{mode === 'content' && (
				<ContentSearchView adhocPhrase={adhocPhrase} onAdhocPhraseChange={setAdhocPhrase} />
			)}
			{mode === 'domain' && (
				<>
					<div className="edu-domain-header">
						<div className="edu-stats-bar">
							{summariesLoading ? (
								<StatsBarSkeleton />
							) : (
								<>
									<Tag large minimal icon="globe">
										{plural(summaries.length, 'institution')}
									</Tag>
									<Tag large minimal icon="people">
										{plural(totalPeople, 'person', 'people')}
									</Tag>
									<Tag large minimal icon="document">
										{`${plural(totalPubs, 'pub')} authored`}
									</Tag>
									<Tag large minimal icon="office">
										{`${plural(totalComms, 'community', 'communities')} touched`}
									</Tag>
								</>
							)}
						</div>
					</div>

					<div className="edu-layout">
						{/* ---- LEFT: domain list ---- */}
						<div className="edu-sidebar">
							{/* Ad-hoc domain lookup */}
							<div className="edu-adhoc-search">
								<InputGroup
									leftIcon="globe-network"
									placeholder="Look up any domain…"
									value={adhocDomain}
									onChange={(e) => setAdhocDomain(e.target.value)}
									onKeyDown={(e: React.KeyboardEvent) =>
										e.key === 'Enter' && handleAdhocDomainSearch()
									}
									rightElement={
										<button
											type="button"
											className="bp3-button bp3-minimal bp3-intent-primary bp3-icon-arrow-right"
											onClick={handleAdhocDomainSearch}
											disabled={!adhocDomain.trim()}
										/>
									}
									small
								/>
							</div>
							<InputGroup
								leftIcon="filter"
								placeholder="Filter known domains…"
								value={domainSearch}
								onChange={(e) => setDomainSearch(e.target.value)}
								className="edu-sidebar-search"
								small
							/>
							{summariesLoading ? (
								<SidebarSkeleton />
							) : (
								<div className="edu-sidebar-list">
									{filteredDomains.map((group, idx) => (
										<div
											key={group.domain}
											className={`edu-sidebar-item${selectedDomain === group.domain ? ' selected' : ''}`}
											onClick={() => setSelectedDomain(group.domain)}
											role="button"
											tabIndex={0}
											onKeyDown={(e) =>
												e.key === 'Enter' && setSelectedDomain(group.domain)
											}
										>
											<span className="edu-sidebar-rank">{idx + 1}</span>
											<span className="edu-sidebar-domain">
												{group.domain}
											</span>
											<span className="edu-sidebar-counts">
												<Tag
													minimal
													round
													intent={Intent.PRIMARY}
													title="People"
												>
													{group.totalPeopleCount}
												</Tag>
												<Tag minimal round title="Pubs authored">
													{group.authoredPubCount}
												</Tag>
											</span>
										</div>
									))}
									{filteredDomains.length === 0 && (
										<div className="edu-sidebar-empty">No matches</div>
									)}
								</div>
							)}
						</div>

						{/* ---- RIGHT: detail panel ---- */}
						<div className="edu-detail">
							{(loading || summariesLoading) && <DetailSkeleton />}
							{!loading && !summariesLoading && activeGroup ? (
								<>
									<div className="edu-detail-header">
										<h3>{activeGroup.domain}</h3>
										<div className="edu-detail-header-meta">
											<Tag intent={Intent.PRIMARY} minimal>
												{plural(
													activeGroup.totalPeopleCount,
													'person',
													'people',
												)}
											</Tag>
											<Tag intent={Intent.SUCCESS} minimal>
												{plural(activeGroup.authoredPubCount, 'pub')}
											</Tag>
											<Tag minimal>
												{plural(
													activeGroup.communities.length,
													'community',
													'communities',
												)}
											</Tag>
										</div>
									</div>
									<Tabs id="edu-detail-tabs" defaultSelectedTabId="overview">
										<Tab
											id="overview"
											title="Overview"
											panel={<OverviewTab group={activeGroup} />}
										/>
										<Tab
											id="communities"
											title={`Communities (${activeGroup.communities.length})`}
											panel={<CommunitiesTab group={activeGroup} />}
										/>
										<Tab
											id="people"
											title={`People (${activeGroup.totalPeopleCount})`}
											panel={<PeopleTab group={activeGroup} />}
										/>
										<Tab
											id="collaborators"
											title="Collaborators"
											panel={<CollaboratorsTab domain={activeGroup.domain} />}
										/>
										<Tab
											id="activity"
											title="Activity"
											panel={<ActivityTab domain={activeGroup.domain} />}
										/>
										<Tab
											id="contentMentions"
											title="Content Mentions"
											panel={
												<ContentMentionsTab domain={activeGroup.domain} />
											}
										/>
									</Tabs>
								</>
							) : !loading && !summariesLoading && selectedDomain ? (
								<NonIdealState
									icon="info-sign"
									title="No data found"
									description={`No results found for "${selectedDomain}".`}
								/>
							) : !loading && !summariesLoading ? (
								<NonIdealState
									icon="search"
									title="Select a domain"
									description="Choose an institution from the list on the left, or look up any domain."
								/>
							) : null}
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default SuggestedHubs;
