import type { HubWithCommunities } from 'types';

import React, { useMemo, useState } from 'react';

import { Button, InputGroup, NonIdealState, Tag } from '@blueprintjs/core';

import UserMenu from 'components/GlobalControls/UserMenu';
import { usePageContext } from 'utils/hooks';
import { getResizedUrl } from 'utils/images';

import './hubLanding.scss';

/** Relative luminance of a hex color (0 = black, 1 = white) */
const getLuminance = (hex: string): number => {
	const c = hex.replace('#', '');
	const r = parseInt(c.substring(0, 2), 16) / 255;
	const g = parseInt(c.substring(2, 4), 16) / 255;
	const b = parseInt(c.substring(4, 6), 16) / 255;
	const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

/** Returns '#FFFFFF' or '#000000' for best contrast against the given background */
const contrastText = (bgHex: string): string => {
	try {
		return getLuminance(bgHex) > 0.4 ? '#000000' : '#FFFFFF';
	} catch {
		return '#FFFFFF';
	}
};

type Props = {
	hubData: HubWithCommunities;
	canCreateCommunity?: boolean;
};

const HubLanding = (props: Props) => {
	const { hubData, canCreateCommunity = false } = props;
	const { loginData } = usePageContext();
	const [filterText, setFilterText] = useState('');

	const accentDark = hubData.accentColorDark || '#2D2E2F';
	const accentLight = hubData.accentColorLight || '#FFFFFF';
	const heroTextColor = contrastText(accentDark);

	const filteredCommunities = useMemo(() => {
		const sorted = [...hubData.communities].sort((a, b) => {
			if (a.updatedAt < b.updatedAt) return 1;
			if (a.updatedAt > b.updatedAt) return -1;
			return a.title.localeCompare(b.title);
		});
		if (!filterText.trim()) return sorted;
		const lower = filterText.toLowerCase();
		return sorted.filter(
			(c) =>
				c.title.toLowerCase().includes(lower) ||
				(c.description && c.description.toLowerCase().includes(lower)),
		);
	}, [hubData.communities, filterText]);

	const totalPubs = hubData.communities.reduce((sum, c) => sum + c.pubCount, 0);

	// Build interleaved grid: community cards + pub-pair cards shuffled together
	type GridCell =
		| { type: 'community'; data: (typeof filteredCommunities)[0] }
		| { type: 'pub-pair'; data: typeof hubData.featuredPubs };
	const gridCells = useMemo((): GridCell[] => {
		const pubs = hubData.featuredPubs || [];
		// Pair pubs into groups of 2
		const pubPairs: (typeof pubs)[] = [];
		for (let i = 0; i < pubs.length; i += 2) {
			pubPairs.push(pubs.slice(i, i + 2));
		}
		// Build community cells
		const communityCells: GridCell[] = filteredCommunities.map((c) => ({
			type: 'community',
			data: c,
		}));
		const pubCells: GridCell[] = pubPairs.map((pair) => ({ type: 'pub-pair', data: pair }));

		if (pubCells.length === 0) return communityCells;
		if (communityCells.length === 0) return pubCells;

		// Interleave: distribute pub-pair cells evenly among community cells
		const result: GridCell[] = [];
		const interval = Math.max(1, Math.floor(communityCells.length / (pubCells.length + 1)));
		let pubIdx = 0;
		for (let i = 0; i < communityCells.length; i++) {
			result.push(communityCells[i]);
			if (pubIdx < pubCells.length && (i + 1) % interval === 0 && i > 0) {
				result.push(pubCells[pubIdx]);
				pubIdx++;
			}
		}
		// Append remaining pub cells
		while (pubIdx < pubCells.length) {
			result.push(pubCells[pubIdx]);
			pubIdx++;
		}
		return result;
	}, [filteredCommunities, hubData.featuredPubs]);

	const fmtDate = (d: string) => {
		try {
			return new Date(d).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		} catch {
			return '';
		}
	};

	return (
		<div className="hub-landing-component">
			{/* Floating top bar */}
			<div className="org-topbar" style={{ backgroundColor: accentDark }}>
				<div className="org-topbar-inner">
					<a
						href={`/hub/${hubData.slug}`}
						className="org-topbar-brand"
						style={{ color: accentLight }}
					>
						{hubData.avatar && (
							<img className="org-topbar-avatar" src={hubData.avatar} alt="" />
						)}
						<span className="org-topbar-title">{hubData.title}</span>
					</a>
					<div className="org-topbar-actions">
						{!hubData.isActive && loginData.isSuperAdmin && (
							<Tag intent="warning">Inactive</Tag>
						)}
						{hubData.isPrivate && loginData.isSuperAdmin && (
							<Tag intent="primary">Private</Tag>
						)}
						{hubData.website && (
							<a
								href={hubData.website}
								target="_blank"
								rel="noopener noreferrer"
								className="org-topbar-link"
								style={{ color: accentLight }}
							>
								Website
							</a>
						)}
						{hubData.email && (
							<a
								href={`mailto:${hubData.email}`}
								className="org-topbar-link"
								style={{ color: accentLight }}
							>
								Contact
							</a>
						)}
						<a
							href="/hubs/docs"
							className="org-topbar-link"
							style={{ color: accentLight }}
						>
							Docs
						</a>
						{(hubData.isActive || loginData.isSuperAdmin) && (
							<a
								href={`/hub/${hubData.slug}/data`}
								className="org-topbar-link"
								style={{ color: accentLight }}
							>
								Dashboard
							</a>
						)}
						{loginData.id ? (
							<UserMenu loginData={loginData} />
						) : (
							<a
								href={`/login?redirect=/hub/${hubData.slug}`}
								className="org-topbar-link"
								style={{ color: accentLight }}
							>
								Log in
							</a>
						)}
					</div>
				</div>
			</div>

			{/* Hero */}
			<div
				className="org-hero"
				style={{
					backgroundImage: hubData.heroImage ? `url("${hubData.heroImage}")` : undefined,
					backgroundColor: accentDark,
				}}
			>
				<div className="org-hero-overlay" />
				<div className="org-hero-content" style={{ color: heroTextColor }}>
					{hubData.heroLogo && (
						<img className="org-hero-logo" src={hubData.heroLogo} alt={hubData.title} />
					)}
					{!hubData.heroLogo && <h1 className="org-hero-title">{hubData.title}</h1>}
					{hubData.subtitle && <p className="org-hero-subtitle">{hubData.subtitle}</p>}
					{hubData.description && (
						<p className="org-hero-description">{hubData.description}</p>
					)}
					<div className="org-hero-stats">
						<div className="org-stat">
							<span className="org-stat-number">{hubData.communities.length}</span>
							<span className="org-stat-label">
								{hubData.communities.length === 1 ? 'Community' : 'Communities'}
							</span>
						</div>
						<div className="org-stat-divider" />
						<div className="org-stat">
							<span className="org-stat-number">{totalPubs.toLocaleString()}</span>
							<span className="org-stat-label">
								{totalPubs === 1 ? 'Publication' : 'Publications'}
							</span>
						</div>
					</div>
					{canCreateCommunity && (
						<a
							href={
								loginData.id
									? `/community/create?hub=${hubData.slug}`
									: `/login?redirect=/community/create?hub=${hubData.slug}`
							}
							className="org-hero-cta"
						>
							<Button large intent="none" icon="plus" className="org-hero-cta-button">
								Create a Community
							</Button>
						</a>
					)}
				</div>
			</div>

			{/* Content section */}
			<div className="org-body">
				<div className="org-body-inner">
					<div className="org-section-header">
						<h2 className="org-section-title">
							{hubData.featuredPubs?.length
								? 'Communities & Publications'
								: 'Communities'}
						</h2>
						<InputGroup
							className="org-filter"
							leftIcon="search"
							placeholder="Search communities..."
							value={filterText}
							onChange={(e) => setFilterText(e.target.value)}
							large
						/>
					</div>

					{gridCells.length === 0 && (
						<NonIdealState
							icon="search"
							title="No communities found"
							description={
								filterText
									? 'Try adjusting your search.'
									: 'No communities have been added to this hub yet.'
							}
						/>
					)}
					<div className="org-grid">
						{gridCells.map((cell) => {
							if (cell.type === 'pub-pair') {
								const pairKey = cell.data.map((p) => p.id).join('-');
								return (
									<div className="org-pub-pair" key={`pp-${pairKey}`}>
										{cell.data.map((pub) => {
											const pubUrl = pub.communityDomain
												? `https://${pub.communityDomain}/pub/${pub.slug}`
												: `https://${pub.communitySlug}.pubpub.org/pub/${pub.slug}`;
											const communityUrl = pub.communityDomain
												? `https://${pub.communityDomain}`
												: `https://${pub.communitySlug}.pubpub.org`;
											return (
												<a
													className="org-pub-card"
													href={pubUrl}
													key={pub.id}
													target="_blank"
													rel="noopener noreferrer"
													style={
														pub.communityAccent
															? {
																	borderLeftColor:
																		pub.communityAccent,
																}
															: undefined
													}
												>
													<div className="pub-card-body">
														<div className="pub-card-title">
															{pub.title}
														</div>
														{pub.description && (
															<div className="pub-card-description">
																{pub.description}
															</div>
														)}
														{pub.byline && (
															<div className="pub-card-byline">
																{pub.byline}
															</div>
														)}
														<div className="pub-card-meta">
															<span
																className="pub-card-community"
																onClick={(e) => {
																	e.preventDefault();
																	e.stopPropagation();
																	window.open(
																		communityUrl,
																		'_blank',
																	);
																}}
																role="link"
																tabIndex={0}
																onKeyDown={(e) => {
																	if (e.key === 'Enter') {
																		e.preventDefault();
																		window.open(
																			communityUrl,
																			'_blank',
																		);
																	}
																}}
															>
																{pub.communityTitle}
															</span>
															{pub.publishedAt && (
																<span className="pub-card-date">
																	{fmtDate(pub.publishedAt)}
																</span>
															)}
														</div>
													</div>
												</a>
											);
										})}
									</div>
								);
							}
							// Community card
							const community = cell.data;
							const resizedLogo = getResizedUrl(community.heroLogo, 'inside', 600);
							const resizedBg = getResizedUrl(
								community.heroBackgroundImage,
								'outside',
								800,
							);
							const communityUrl = community.domain
								? `https://${community.domain}`
								: `https://${community.subdomain}.pubpub.org`;
							const displayUrl =
								community.domain || `${community.subdomain}.pubpub.org`;
							const cardAccent = community.accentColorDark || '#2D2E2F';
							const cardAccentLight = community.accentColorLight || '#F7F8FA';
							const hasHeroImage = !!community.heroBackgroundImage;
							const cardTextColor = contrastText(cardAccent);
							const bgStyle: React.CSSProperties = hasHeroImage
								? {
										backgroundColor: cardAccentLight,
										color: cardTextColor,
										backgroundImage: `url("${resizedBg}")`,
									}
								: {
										background: `linear-gradient(135deg, ${cardAccent} 0%, ${cardAccentLight} 100%)`,
										color: cardTextColor,
									};
							return (
								<a
									className="org-community-card"
									href={communityUrl}
									key={community.id}
									style={
										{
											'--card-accent': cardAccent,
											'--card-accent-light': cardAccentLight,
										} as React.CSSProperties
									}
								>
									<div
										className="card-accent-bar"
										style={{ backgroundColor: cardAccent }}
									/>
									<div className="card-hero" style={bgStyle}>
										<div className="logo-wrapper">
											{community.heroLogo && (
												<img
													className="logo"
													src={resizedLogo}
													alt={community.title}
												/>
											)}
											{!community.heroLogo && <h3>{community.title}</h3>}
										</div>
									</div>
									<div className="card-info">
										<div className="card-title">{community.title}</div>
										{community.description && (
											<div className="card-description">
												{community.description}
											</div>
										)}
										<div className="card-meta">
											<span className="card-url">{displayUrl}</span>
											<span
												className="card-pub-count"
												style={{
													backgroundColor: cardAccent,
													color: cardAccentLight,
												}}
											>
												{community.pubCount} pub
												{community.pubCount !== 1 ? 's' : ''}
											</span>
										</div>
									</div>
								</a>
							);
						})}
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="org-footer" style={{ backgroundColor: accentDark, color: accentLight }}>
				<div className="org-footer-inner">
					<div className="org-footer-brand">
						{hubData.avatar && (
							<img src={hubData.avatar} alt="" className="org-footer-avatar" />
						)}
						<span>{hubData.title}</span>
					</div>
					<div className="org-footer-powered">
						Powered by{' '}
						<a href="https://www.pubpub.org" style={{ color: accentLight }}>
							PubPub
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default HubLanding;
