import type { OrgDataPayload } from 'server/hub/dataQueries';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ButtonGroup, Switch } from '@blueprintjs/core';

import HubGraphBipartite from './HubGraphBipartite';
import HubGraphEdgeBundle from './HubGraphEdgeBundle';
import HubGraphForce from './HubGraphForce';
import HubGraphMatrix from './HubGraphMatrix';
import HubGraphTree from './HubGraphTree';
import { buildGraphData, COLORS } from './hubGraphData';

type Props = { orgData: OrgDataPayload };

type ViewMode = 'force' | 'bundle' | 'bipartite' | 'matrix' | 'tree';

const VIEW_LABELS: Record<ViewMode, { label: string; icon: string }> = {
	force: { label: 'Force', icon: 'layout-auto' },
	bundle: { label: 'Bundle', icon: 'layout-circle' },
	bipartite: { label: 'Columns', icon: 'layout-linear' },
	matrix: { label: 'Matrix', icon: 'grid-view' },
	tree: { label: 'Tree', icon: 'diagram-tree' },
};

const VIEW_ORDER: ViewMode[] = ['force', 'bundle', 'bipartite', 'matrix', 'tree'];

const HubGraphTab = ({ orgData }: Props) => {
	const [viewMode, setViewMode] = useState<ViewMode>('force');
	const [showPubs, setShowPubs] = useState(true);
	const [showPeople, setShowPeople] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);
	const [graphHeight, setGraphHeight] = useState<number | null>(null);

	const data = useMemo(() => buildGraphData(orgData), [orgData]);

	// Measure remaining vertical space below the controls
	const measureHeight = useCallback(() => {
		const el = containerRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const available = window.innerHeight - rect.top - 16; // 16px bottom padding
		setGraphHeight(Math.max(available, 400));
	}, []);

	useEffect(() => {
		measureHeight();
		window.addEventListener('resize', measureHeight);
		return () => window.removeEventListener('resize', measureHeight);
	}, [measureHeight]);

	const [jsonCopied, setJsonCopied] = useState(false);
	const handleCopyJson = () => {
		const crossCommunityPeople = [...data.personCommunities.entries()]
			.filter(([, cids]) => cids.size >= 2)
			.map(([id, cids]) => {
				const node = data.people.find((p) => p.id === id);
				return {
					name: node?.label ?? id,
					role: node?.role,
					communityCount: cids.size,
					communities: [...cids].map((cid) => {
						const c = data.communities.find((cm) => cm.id === `community:${cid}`);
						return c?.label ?? cid;
					}),
				};
			});

		const summary = {
			hub: {
				communityCount: orgData.communityStats.length,
				totalPubs: orgData.recentPubs.length,
				totalAuthors: orgData.topAuthors.length,
			},
			communities: orgData.communityStats.map((c) => ({
				id: c.id,
				title: c.title,
				pubCount: c.pubCount,
				authorCount: c.authorCount,
				dataAccess: c.dataAccess,
				managers: c.managers?.map((m) => m.name) || [],
			})),
			graph: {
				nodes: data.nodes.length,
				links: data.links.length,
				communities: data.communities.length,
				pubs: data.pubs.length,
				people: data.people.length,
				crossCommunityPeopleCount: crossCommunityPeople.length,
			},
			crossCommunityPeople,
			communityOverlap: [...data.communityOverlap.entries()]
				.map(([key, names]) => {
					const [a, b] = key.split('|');
					const ca = data.communities.find((c) => c.id === `community:${a}`);
					const cb = data.communities.find((c) => c.id === `community:${b}`);
					return {
						communities: [ca?.label ?? a, cb?.label ?? b],
						sharedPeople: names,
						count: names.length,
					};
				})
				.sort((a, b) => b.count - a.count),
		};
		navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
		setJsonCopied(true);
		setTimeout(() => setJsonCopied(false), 2000);
	};

	// Matrix doesn't use pub/people toggles
	const showToggles = viewMode !== 'matrix';

	return (
		<div className="hub-graph-tab">
			<div className="hub-graph-controls">
				<ButtonGroup>
					{VIEW_ORDER.map((mode) => (
						<Button
							key={mode}
							icon={VIEW_LABELS[mode].icon as any}
							text={VIEW_LABELS[mode].label}
							active={viewMode === mode}
							onClick={() => setViewMode(mode)}
							small
							minimal={viewMode !== mode}
						/>
					))}
				</ButtonGroup>
				{showToggles && (
					<div className="hub-graph-toggles">
						<Switch
							checked={showPubs}
							label={`Pubs (${data.pubs.length})`}
							onChange={() => setShowPubs((v) => !v)}
							inline
							alignIndicator="right"
						/>
						<Switch
							checked={showPeople}
							label={`People (${data.people.length})`}
							onChange={() => setShowPeople((v) => !v)}
							inline
							alignIndicator="right"
						/>
					</div>
				)}
				<div className="hub-graph-legend">
					<span className="hub-graph-legend-item">
						<span
							className="hub-graph-legend-dot"
							style={{ backgroundColor: COLORS.community }}
						/>
						{data.communities.length} Communities
					</span>
					<span className="hub-graph-legend-item">
						<span
							className="hub-graph-legend-dot"
							style={{ backgroundColor: COLORS.pub }}
						/>
						{data.pubs.length} Pubs
					</span>
					<span className="hub-graph-legend-item">
						<span
							className="hub-graph-legend-dot"
							style={{ backgroundColor: COLORS.author }}
						/>
						Authors
					</span>
					<span className="hub-graph-legend-item">
						<span
							className="hub-graph-legend-dot"
							style={{ backgroundColor: COLORS.manager }}
						/>
						Managers
					</span>
					<Button
						icon={jsonCopied ? 'tick' : 'clipboard'}
						text={jsonCopied ? 'Copied!' : 'JSON'}
						onClick={handleCopyJson}
						small
						minimal
					/>
				</div>
			</div>

			<div
				ref={containerRef}
				className="hub-graph-fill"
				style={graphHeight ? { height: graphHeight } : undefined}
			>
				{viewMode === 'force' && (
					<HubGraphForce data={data} showPubs={showPubs} showPeople={showPeople} />
				)}
				{viewMode === 'bundle' && (
					<HubGraphEdgeBundle data={data} showPubs={showPubs} showPeople={showPeople} />
				)}
				{viewMode === 'bipartite' && (
					<HubGraphBipartite data={data} showPubs={showPubs} showPeople={showPeople} />
				)}
				{viewMode === 'matrix' && <HubGraphMatrix data={data} />}
				{viewMode === 'tree' && (
					<HubGraphTree data={data} showPubs={showPubs} showPeople={showPeople} />
				)}
			</div>
		</div>
	);
};

export default HubGraphTab;
