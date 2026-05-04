import type { GraphData, GraphNode } from './hubGraphData';

import React, { useCallback, useMemo, useState } from 'react';

import { COLORS } from './hubGraphData';

type Props = { data: GraphData; showPubs: boolean; showPeople: boolean };

const INDENT = 24;
const ROW_H = 24;
const NODE_R = { community: 6, pub: 2.5, person: 3.5 };

type TreeRow = {
	node: GraphNode;
	depth: number;
	expanded: boolean;
	childCount: number;
};

const HubGraphTree = ({ data, showPubs, showPeople }: Props) => {
	const [expanded, setExpanded] = useState<Set<string>>(() => {
		// Start with all communities expanded
		return new Set(data.communities.map((c) => c.id));
	});
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const toggleExpand = useCallback((id: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	// Build connected set for cross-highlighting
	const connectedIds = useMemo(() => {
		const active = selectedId || hoveredId;
		if (!active) return new Set<string>();
		const connected = new Set<string>([active]);
		for (const link of data.links) {
			if (link.source === active) connected.add(link.target);
			if (link.target === active) connected.add(link.source);
		}
		return connected;
	}, [data.links, selectedId, hoveredId]);

	const rows = useMemo(() => {
		const result: TreeRow[] = [];

		for (const c of data.communities) {
			const cid = c.id.replace('community:', '');
			const isExpanded = expanded.has(c.id);

			// Count children
			const pubIds = showPubs ? data.communityPubs.get(cid) || [] : [];
			const people = showPeople
				? data.people.filter((p) => data.personCommunities.get(p.id)?.has(cid))
				: [];
			const childCount = pubIds.length + people.length;

			result.push({
				node: c,
				depth: 0,
				expanded: isExpanded,
				childCount,
			});

			if (!isExpanded) continue;

			// Managers first
			const managers = people.filter((p) => p.role === 'manager' || p.role === 'both');
			for (const m of managers) {
				result.push({ node: m, depth: 1, expanded: false, childCount: 0 });
			}

			// Then pubs
			for (const pid of pubIds) {
				const pubNode = data.pubs.find((p) => p.id === `pub:${pid}`);
				if (!pubNode) continue;
				result.push({ node: pubNode, depth: 1, expanded: false, childCount: 0 });

				// Authors of this pub (nested)
				if (showPeople) {
					const pubAuthors = data.people.filter((p) => {
						if (p.role === 'manager') return false; // already shown above
						return data.personPubs.get(p.id)?.has(pid);
					});
					for (const a of pubAuthors) {
						result.push({ node: a, depth: 2, expanded: false, childCount: 0 });
					}
				}
			}

			// Authors not connected to pubs in our dataset
			if (showPeople) {
				const authors = people.filter(
					(p) =>
						p.role === 'author' &&
						!managers.includes(p) &&
						// Not already shown under a pub
						!pubIds.some((pid) => data.personPubs.get(p.id)?.has(pid)),
				);
				for (const a of authors) {
					result.push({ node: a, depth: 1, expanded: false, childCount: 0 });
				}
			}
		}

		return result;
	}, [data, expanded, showPubs, showPeople]);

	const active = selectedId || hoveredId;

	// Cross-community arcs: find people who span multiple communities
	const crossLinks = useMemo(() => {
		if (!showPeople) return [];
		const links: Array<{ personId: string; personLabel: string; communityIds: string[] }> = [];
		for (const person of data.people) {
			const cids = data.personCommunities.get(person.id);
			if (cids && cids.size >= 2) {
				links.push({
					personId: person.id,
					personLabel: person.label,
					communityIds: [...cids],
				});
			}
		}
		return links;
	}, [data, showPeople]);

	const svgWidth = 700;
	const svgHeight = rows.length * ROW_H + 60;

	return (
		<div className="hub-graph-container" style={{ overflow: 'auto' }}>
			<svg
				width={svgWidth}
				height={svgHeight}
				style={{ display: 'block', fontFamily: 'sans-serif' }}
			>
				{/* Tree indent lines */}
				{rows.map((row, i) => {
					if (row.depth === 0) return null;
					const x = 20 + row.depth * INDENT - INDENT / 2;
					const y = 30 + i * ROW_H + ROW_H / 2;
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: stable tree layout
						<g key={`line-${i}`}>
							<line
								x1={x}
								y1={y}
								x2={x + INDENT / 2 - 4}
								y2={y}
								stroke="rgba(0,0,0,0.08)"
								strokeWidth={1}
							/>
							{/* Vertical connector */}
							{i > 0 && rows[i - 1].depth <= row.depth && (
								<line
									x1={x}
									y1={30 + (i - 1) * ROW_H + ROW_H / 2}
									x2={x}
									y2={y}
									stroke="rgba(0,0,0,0.08)"
									strokeWidth={1}
								/>
							)}
						</g>
					);
				})}

				{/* Nodes */}
				{rows.map((row, i) => {
					const x = 20 + row.depth * INDENT;
					const y = 30 + i * ROW_H;
					const { node } = row;
					const isActive = active === node.id;
					const isConnected = connectedIds.has(node.id);
					const dimmed = active && !isActive && !isConnected;

					let color = COLORS.community;
					let nodeRadius = NODE_R.community;
					if (node.type === 'pub') {
						color = COLORS.pub;
						nodeRadius = NODE_R.pub;
					} else if (node.type === 'person') {
						color =
							node.role === 'manager' || node.role === 'both'
								? COLORS.manager
								: COLORS.author;
						nodeRadius = NODE_R.person;
					}

					return (
						<g
							key={node.id}
							role="button"
							tabIndex={0}
							opacity={dimmed ? 0.2 : 1}
							style={{ cursor: 'pointer' }}
							onMouseEnter={() => setHoveredId(node.id)}
							onMouseLeave={() => setHoveredId(null)}
							onClick={() => {
								if (node.type === 'community') {
									toggleExpand(node.id);
								} else {
									setSelectedId((prev) => (prev === node.id ? null : node.id));
								}
							}}
						>
							{/* Expand/collapse indicator for communities */}
							{node.type === 'community' && (
								<text
									x={x - 10}
									y={y + ROW_H / 2}
									fontSize={10}
									fill="#8a9ba8"
									dominantBaseline="central"
									textAnchor="middle"
								>
									{row.expanded ? '▾' : '▸'}
								</text>
							)}
							{/* Node circle */}
							{node.type === 'community' ? (
								<>
									<circle
										cx={x + 6}
										cy={y + ROW_H / 2}
										r={nodeRadius}
										fill={COLORS.community}
										stroke={isActive ? COLORS.community : 'rgba(0,0,0,0.1)'}
										strokeWidth={isActive ? 2 : 0.5}
									/>
									<circle
										cx={x + 6}
										cy={y + ROW_H / 2}
										r={3.5}
										fill={node.accentColor || '#137cbd'}
									/>
								</>
							) : (
								<circle
									cx={x + 6}
									cy={y + ROW_H / 2}
									r={nodeRadius}
									fill={isActive ? '#fff' : color}
									stroke={isActive ? color : 'none'}
									strokeWidth={isActive ? 1.5 : 0}
								/>
							)}
							{/* Label */}
							<text
								x={x + 18}
								y={y + ROW_H / 2}
								fontSize={node.type === 'community' ? 12 : 10}
								fill={isActive ? '#137cbd' : '#394b59'}
								fontWeight={
									node.type === 'community' || isActive ? 'bold' : 'normal'
								}
								dominantBaseline="central"
							>
								{node.label.length > 50
									? `${node.label.slice(0, 48)}…`
									: node.label}
							</text>
							{/* Meta */}
							{node.type === 'community' && (
								<text
									x={x + 18}
									y={y + ROW_H / 2}
									dx={Math.min(node.label.length, 50) * 6.5 + 8}
									fontSize={9}
									fill="#8a9ba8"
									dominantBaseline="central"
								>
									{node.pubCount?.toLocaleString()} pubs · {row.childCount} items
								</text>
							)}
							{node.type === 'person' && node.role && (
								<text
									x={x + 18}
									y={y + ROW_H / 2}
									dx={node.label.length * 5.5 + 8}
									fontSize={8}
									fill="#8a9ba8"
									dominantBaseline="central"
								>
									{node.role}
								</text>
							)}
						</g>
					);
				})}

				{/* Cross-community indicators */}
				{crossLinks.length > 0 && (
					<g>
						{crossLinks.map((cl) => {
							const personRow = rows.findIndex((r) => r.node.id === cl.personId);
							if (personRow < 0) return null;
							const isHighlighted = active === cl.personId;
							if (active && !isHighlighted) return null;
							const y = 30 + personRow * ROW_H + ROW_H / 2;

							return (
								<g key={cl.personId}>
									{cl.communityIds.map((cid) => {
										const commRow = rows.findIndex(
											(r) => r.node.id === `community:${cid}`,
										);
										if (commRow < 0) return null;
										const cy2 = 30 + commRow * ROW_H + ROW_H / 2;
										return (
											<line
												key={cid}
												x1={svgWidth - 30}
												y1={y}
												x2={svgWidth - 30}
												y2={cy2}
												stroke="rgba(145,121,242,0.3)"
												strokeWidth={isHighlighted ? 2 : 1}
												strokeDasharray={isHighlighted ? 'none' : '2,2'}
											/>
										);
									})}
									<circle cx={svgWidth - 30} cy={y} r={3} fill={COLORS.manager} />
								</g>
							);
						})}
					</g>
				)}
			</svg>
		</div>
	);
};

export default HubGraphTree;
