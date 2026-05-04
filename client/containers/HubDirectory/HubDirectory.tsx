import type { HubDirectoryEntry } from 'types';

import React, { useMemo, useState } from 'react';

import { InputGroup, NonIdealState, Tag } from '@blueprintjs/core';

import { GridWrapper } from 'components';
import { usePageContext } from 'utils/hooks';
import { getResizedUrl } from 'utils/images';

import './hubDirectory.scss';

type Props = {
	hubs: HubDirectoryEntry[];
};

const HubDirectory = (props: Props) => {
	const { hubs } = props;
	const { loginData } = usePageContext();
	const [filterText, setFilterText] = useState('');

	const filtered = useMemo(() => {
		if (!filterText.trim()) return hubs;
		const lower = filterText.toLowerCase();
		return hubs.filter(
			(org) =>
				org.title.toLowerCase().includes(lower) ||
				(org.subtitle && org.subtitle.toLowerCase().includes(lower)) ||
				(org.description && org.description.toLowerCase().includes(lower)),
		);
	}, [hubs, filterText]);

	const _totalCommunities = hubs.reduce((s, o) => s + o.communityCount, 0);
	const _totalPubs = hubs.reduce((s, o) => s + o.pubCount, 0);

	return (
		<div className="hub-directory-component">
			{/* Hero */}
			<div className="org-dir-hero">
				<div className="org-dir-hero-inner">
					<p className="org-dir-hero-eyebrow">PubPub Hubs</p>
					<h1 className="org-dir-hero-title">Advancing Open Knowledge Together</h1>
					<p className="org-dir-hero-subtitle">
						Explore work on PubPub, curated by the universities, libraries, presses,
						foundations, and research groups using PubPub to publish and share knowledge
						openly.
					</p>
					<div className="org-dir-hero-actions">
						<a href="mailto:partnerships@pubpub.org" className="org-dir-hero-cta">
							Become a Partner
						</a>
						<a href="/hubs/pricing" className="org-dir-hero-cta-secondary">
							Learn More
						</a>
					</div>
				</div>
			</div>

			{/* Body */}
			<GridWrapper>
				<div className="org-dir-body">
					<div className="org-dir-toolbar">
						<InputGroup
							className="org-dir-filter"
							leftIcon="search"
							placeholder="Search hubs..."
							value={filterText}
							onChange={(e) => setFilterText(e.target.value)}
							large
						/>
					</div>

					{filtered.length === 0 && (
						<NonIdealState
							icon="search"
							title="No hubs found"
							description={
								filterText
									? 'Try adjusting your search.'
									: 'No hubs are listed yet.'
							}
						/>
					)}

					<div className="org-dir-grid">
						{filtered.map((org) => {
							const accentDark = org.accentColorDark || '#2D2E2F';
							const accentLight = org.accentColorLight || '#FFFFFF';
							const hasHero = !!org.heroImage;
							const resizedHero = getResizedUrl(org.heroImage, 'outside', 800);
							const heroStyle: React.CSSProperties = hasHero
								? {
										backgroundImage: `url("${resizedHero}")`,
										backgroundColor: accentDark,
									}
								: {
										background: `linear-gradient(135deg, ${accentDark} 0%, ${accentLight} 100%)`,
									};
							return (
								<a className="org-dir-card" href={`/hub/${org.slug}`} key={org.id}>
									<div className="org-dir-card-hero" style={heroStyle}>
										<div className="org-dir-card-hero-overlay" />
										<div className="org-dir-card-hero-content">
											{org.heroLogo ? (
												<img
													className="org-dir-card-logo"
													src={org.heroLogo}
													alt={org.title}
												/>
											) : org.avatar ? (
												<img
													className="org-dir-card-avatar"
													src={org.avatar}
													alt={org.title}
												/>
											) : (
												<div
													className="org-dir-card-monogram"
													style={{
														backgroundColor: accentLight,
														color: accentDark,
													}}
												>
													{org.title.charAt(0).toUpperCase()}
												</div>
											)}
										</div>
									</div>
									<div className="org-dir-card-body">
										<div
											className="org-dir-card-accent"
											style={{ backgroundColor: accentDark }}
										/>
										<h3 className="org-dir-card-title">
											{org.title}
											{!org.isActive && loginData.isSuperAdmin && (
												<Tag
													minimal
													intent="warning"
													style={{
														marginLeft: 8,
														verticalAlign: 'middle',
													}}
												>
													Inactive
												</Tag>
											)}
										</h3>
										{org.subtitle && (
											<p className="org-dir-card-subtitle">{org.subtitle}</p>
										)}
										{org.description && (
											<p className="org-dir-card-description">
												{org.description}
											</p>
										)}
										<div className="org-dir-card-meta">
											<span className="org-dir-card-stat">
												<strong>{org.communityCount}</strong> communit
												{org.communityCount !== 1 ? 'ies' : 'y'}
											</span>
											<span className="org-dir-card-dot">&middot;</span>
											<span className="org-dir-card-stat">
												<strong>{org.pubCount.toLocaleString()}</strong> pub
												{org.pubCount !== 1 ? 's' : ''}
											</span>
										</div>
									</div>
								</a>
							);
						})}
					</div>
				</div>
			</GridWrapper>
		</div>
	);
};

export default HubDirectory;
