import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
	Button,
	Checkbox,
	Classes,
	InputGroup,
	NonIdealState,
	Spinner,
	Tab,
	Tabs,
} from '@blueprintjs/core';

import { Icon } from 'components';
import { usePageContext, useThrottled } from 'utils/hooks';
import { getResizedUrl } from 'utils/images';
import { generatePubBackground } from 'utils/pubs';

import './search2.scss';

/* ---------- types ---------- */
type PubResult = {
	id: string;
	title: string;
	slug: string;
	avatar: string | null;
	description: string | null;
	byline: string | null;
	communityId: string;
	communityTitle: string;
	communitySlug: string;
	communityDomain: string | null;
	communityAvatar: string | null;
	communityAccentColorDark: string | null;
	communityAccentColorLight: string | null;
	communityHeaderLogo: string | null;
	communityTextColor: string | null;
};

type CommunityResult = {
	id: string;
	title: string;
	subdomain: string;
	domain: string | null;
	description: string | null;
	avatar: string | null;
	accentColorDark: string | null;
	headerLogo: string | null;
	pubCount: number;
};

type AuthorFacet = { name: string; count: number };
type SearchMode = 'pubs' | 'communities';
type FieldKey = 'title' | 'description' | 'byline' | 'content';

const ALL_FIELDS: { key: FieldKey; label: string }[] = [
	{ key: 'title', label: 'Title' },
	{ key: 'description', label: 'Description' },
	{ key: 'byline', label: 'Authors' },
	{ key: 'content', label: 'Full text' },
];

const PAGE_SIZE = 20;

/* ---------- helpers ---------- */
const getSearchPath = (query: string, page: number, mode: string) => {
	const params = new URLSearchParams();
	if (query) params.append('q', query);
	if (page > 0) params.append('page', String(page + 1));
	if (mode !== 'pubs') params.append('mode', mode);
	const qs = params.toString();
	return `/search${qs ? `?${qs}` : ''}`;
};

const updateHistory = (query: string, page: number, mode: string) => {
	window.history.replaceState({}, '', getSearchPath(query, page, mode));
};

const getCommunityUrl = (r: { communityDomain: string | null; communitySlug: string }) =>
	r.communityDomain ? `https://${r.communityDomain}` : `https://${r.communitySlug}.pubpub.org`;

/* ---------- Pub result row (matches /search style) ---------- */
const PubResultRow = ({ item, isBasePubPub }: { item: PubResult; isBasePubPub: boolean }) => {
	const communityUrl = getCommunityUrl(item);
	const link = `${communityUrl}/pub/${item.slug}`;
	const resizedBanner = getResizedUrl(item.avatar, 'inside', 800);
	const resizedCommunityLogo = getResizedUrl(item.communityAvatar, 'inside', 125, 35);
	const bannerStyle = item.avatar
		? { backgroundImage: `url("${resizedBanner}")` }
		: { background: generatePubBackground(item.id) };

	return (
		<div className="result pubs">
			<div>
				<a href={link}>
					<div className="banner-image" style={bannerStyle} />
				</a>
			</div>
			<div className="content">
				<div className="title">
					<a href={link} className="pub-title">
						{item.title}
					</a>
					{isBasePubPub && (
						<div className="community-title">
							<a
								href={communityUrl}
								style={{
									backgroundColor: item.communityAccentColorDark || '#2D2E2F',
									color: item.communityTextColor || '#fff',
								}}
							>
								{resizedCommunityLogo ? (
									<img
										alt={`${item.communityTitle} logo`}
										src={resizedCommunityLogo}
									/>
								) : (
									<span>: {item.communityTitle}</span>
								)}
							</a>
						</div>
					)}
				</div>
				{item.byline && <div className="byline">{item.byline}</div>}
				{item.description && <div className="description">{item.description}</div>}
			</div>
		</div>
	);
};

/* ---------- Community result row ---------- */
const CommunityResultRow = ({ item }: { item: CommunityResult }) => {
	const url = item.domain ? `https://${item.domain}` : `https://${item.subdomain}.pubpub.org`;
	const resizedAvatar = getResizedUrl(item.avatar, 'inside', 200);
	return (
		<div className="result communities">
			<div>
				<a href={url}>
					<div
						className="banner-image"
						style={
							resizedAvatar
								? { backgroundImage: `url("${resizedAvatar}")` }
								: { backgroundColor: item.accentColorDark || '#2D2E2F' }
						}
					/>
				</a>
			</div>
			<div className="content">
				<div className="title">
					<a href={url} className="pub-title">
						{item.title}
					</a>
				</div>
				{item.description && <div className="description">{item.description}</div>}
				<div className="community-meta">
					<Icon icon="pubDoc" iconSize={12} />
					<span>
						{item.pubCount} published pub{item.pubCount !== 1 ? 's' : ''}
					</span>
				</div>
			</div>
		</div>
	);
};

/* ---------- Sidebar ---------- */
const SearchSidebar = ({
	fields,
	onFieldToggle,
	authors,
	activeAuthor,
	onAuthorClick,
}: {
	fields: Set<FieldKey>;
	onFieldToggle: (f: FieldKey) => void;
	authors: AuthorFacet[];
	activeAuthor: string | null;
	onAuthorClick: (name: string | null) => void;
}) => (
	<aside className="search2-sidebar">
		<div className="sidebar-section">
			<h4 className="sidebar-heading">Search in</h4>
			{ALL_FIELDS.map((f) => (
				<Checkbox
					key={f.key}
					label={f.label}
					checked={fields.has(f.key)}
					onChange={() => onFieldToggle(f.key)}
					className="sidebar-checkbox"
				/>
			))}
		</div>
		{authors.length > 0 && (
			<div className="sidebar-section">
				<h4 className="sidebar-heading">
					Authors
					{activeAuthor && (
						<button
							type="button"
							className="sidebar-clear"
							onClick={() => onAuthorClick(null)}
						>
							Clear
						</button>
					)}
				</h4>
				<ul className="sidebar-facet-list">
					{authors.map((a) => (
						<li key={a.name}>
							<button
								type="button"
								className={`facet-btn ${activeAuthor === a.name ? 'active' : ''}`}
								onClick={() =>
									onAuthorClick(activeAuthor === a.name ? null : a.name)
								}
							>
								<span className="facet-name">{a.name}</span>
								<span className="facet-count">{a.count}</span>
							</button>
						</li>
					))}
				</ul>
			</div>
		)}
	</aside>
);

/* ---------- Main component ---------- */
const Search2 = () => {
	const { locationData, communityData } = usePageContext();
	const isBasePubPub = locationData.isBasePubPub;

	const [searchQuery, setSearchQuery] = useState<string>(locationData.query.q || '');
	const [results, setResults] = useState<any[]>([]);
	const [total, setTotal] = useState(0);
	const [isLoading, setIsLoading] = useState(!!locationData.query.q);
	const [page, setPage] = useState(
		locationData.query.page ? Number(locationData.query.page) - 1 : 0,
	);
	const initialMode = locationData.query.mode || (isBasePubPub ? 'communities' : 'pubs');
	const [mode, setMode] = useState<SearchMode>(
		initialMode === 'communities' && isBasePubPub ? 'communities' : 'pubs',
	);

	// Facet state
	const [fields, setFields] = useState<Set<FieldKey>>(
		new Set(['title', 'description', 'byline'] as FieldKey[]),
	);
	const [authorFacets, setAuthorFacets] = useState<AuthorFacet[]>([]);
	const [activeAuthor, setActiveAuthor] = useState<string | null>(null);
	const [sidebarOpen, _setSidebarOpen] = useState(true);

	const throttledQuery = useThrottled(searchQuery, 1000, false);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		const input = inputRef.current;
		if (input) {
			input.focus();
			const old = input.value;
			input.value = '';
			input.value = old;
		}
	}, []);

	const handleFieldToggle = useCallback((key: FieldKey) => {
		setFields((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				if (next.size > 1) next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
		setPage(0);
	}, []);

	const handleAuthorClick = useCallback((name: string | null) => {
		setActiveAuthor(name);
		setPage(0);
	}, []);

	const doSearch = useCallback(
		async (q: string, p: number, m: string, f: Set<FieldKey>, auth: string | null) => {
			if (!q.trim()) {
				setResults([]);
				setTotal(0);
				setAuthorFacets([]);
				setIsLoading(false);
				return;
			}

			if (abortRef.current) abortRef.current.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			setIsLoading(true);

			const params = new URLSearchParams({
				q: q.trim(),
				mode: m,
				page: String(p),
				limit: String(PAGE_SIZE),
			});

			if (m === 'pubs') {
				const fieldArr = Array.from(f);
				params.append('fields', fieldArr.join(','));
				if (auth) params.append('author', auth);
				if (!isBasePubPub) params.append('communityId', communityData.id);
			}

			try {
				const resp = await fetch(`/api/search?${params}`, {
					signal: controller.signal,
					credentials: 'include',
				});
				if (!resp.ok) throw new Error('Search failed');
				const data = await resp.json();
				if (!controller.signal.aborted) {
					setResults(data.results);
					setTotal(data.total);
					if (data.facets?.authors) setAuthorFacets(data.facets.authors);
					setIsLoading(false);
				}
			} catch (err: any) {
				if (err.name !== 'AbortError') {
					setIsLoading(false);
					setResults([]);
					setTotal(0);
				}
			}
		},
		[isBasePubPub, communityData.id],
	);

	useEffect(() => {
		setActiveAuthor(null);
		setPage(0);
	}, [throttledQuery]);

	useEffect(() => {
		doSearch(throttledQuery, page, mode, fields, activeAuthor);
		updateHistory(throttledQuery, page, mode);
	}, [throttledQuery, page, mode, fields, activeAuthor, doSearch]);

	const numPages = Math.min(Math.ceil(total / PAGE_SIZE), 10);
	const searchString = getSearchPath(throttledQuery, page, mode);
	const showSidebar = mode === 'pubs' && sidebarOpen && !!throttledQuery.trim();
	const pages = new Array(numPages).fill('');

	return (
		<div id="search-container">
			<div className="container narrow">
				<div className="row">
					<div className="col-12">
						<div className="search-header">
							<h2>Search {communityData.title}</h2>
							{!isBasePubPub && (
								<a href={`https://www.pubpub.org${searchString}`}>
									Search all PubPub Communities
								</a>
							)}
						</div>
						<InputGroup
							placeholder="search..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(0);
							}}
							rightElement={isLoading ? <Spinner size={35} /> : undefined}
							inputRef={inputRef as any}
						/>
					</div>
				</div>
				<div className="row">
					<div className="col-12">
						<div className="tabs-filter-row">
							<Tabs
								onChange={(nextMode) => {
									setMode(nextMode as SearchMode);
									setPage(0);
									setResults([]);
								}}
								selectedTabId={mode}
								large={true}
								animate={false}
							>
								{isBasePubPub && <Tab id="communities" title="Communities" />}
								<Tab id="pubs" title="Pubs" />
							</Tabs>
							{/* mode === 'pubs' && throttledQuery.trim() && (
								<button
									type="button"
									className="filter-toggle"
									onClick={() => setSidebarOpen((v) => !v)}
								>
									<Icon icon="filter" iconSize={14} />
									{sidebarOpen ? 'Hide Filters' : 'Show Filters'}
								</button>
							) */}
						</div>
					</div>
				</div>
				<div className="row">
					<div className="col-12">
						<div className={`search2-layout ${showSidebar ? 'with-sidebar' : ''}`}>
							{showSidebar && (
								<SearchSidebar
									fields={fields}
									onFieldToggle={handleFieldToggle}
									authors={authorFacets}
									activeAuthor={activeAuthor}
									onAuthorClick={handleAuthorClick}
								/>
							)}
							<div className="search2-results">
								{/* Active filter summary */}
								{!!results.length && (activeAuthor || numPages > 1) && (
									<p className="search2-count">
										{total} result{total !== 1 ? 's' : ''}
										{activeAuthor && (
											<>
												{' '}
												by <strong>{activeAuthor}</strong>
											</>
										)}
										{numPages > 1 && ` · Page ${page + 1} of ${numPages}`}
									</p>
								)}

								{/* No results */}
								{!results.length && searchQuery && !isLoading && (
									<NonIdealState title="No Results" icon="search" />
								)}

								{/* Result rows */}
								{!!results.length && (
									<div>
										{mode === 'pubs' &&
											results.map((item: PubResult) => (
												<PubResultRow
													key={item.id}
													item={item}
													isBasePubPub={isBasePubPub}
												/>
											))}
										{mode === 'communities' &&
											results.map((item: CommunityResult) => (
												<CommunityResultRow key={item.id} item={item} />
											))}

										{/* Pagination */}
										{numPages > 1 && (
											<div
												className={`${Classes.BUTTON_GROUP} ${Classes.LARGE}`}
											>
												{pages.map((_: any, index: number) => {
													const key = `page-button-${index}`;
													return (
														<Button
															key={key}
															text={index + 1}
															active={index === page}
															onClick={() => {
																setPage(index);
																window.scrollTo(0, 0);
															}}
														/>
													);
												})}
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Search2;
