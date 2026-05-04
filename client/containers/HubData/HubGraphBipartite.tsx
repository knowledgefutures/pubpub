import type { GraphData, GraphNode } from './hubGraphData';

import React, { useCallback, useMemo, useState } from 'react';

import { COLORS } from './hubGraphData';

type Props = { data: GraphData; showPubs: boolean; showPeople: boolean };

const COL_WIDTH = 220;
const ROW_H = 22;
const COMMUNITY_COL_X = 20;
const PUB_COL_X = 280;
const PEOPLE_COL_X = 580;
const LEFT_PAD = 10;

const HubGraphBipartite = ({ data, showPubs, showPeople }: Props) => {
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const layout = useMemo(() => {
		// Communities column
		const communityY = new Map<string, number>();
		let cy = 40;
		for (const c of data.communities) {
			communityY.set(c.id, cy);
			cy += ROW_H + 4;
		}

		// Pubs column — grouped by community
		const pubY = new Map<string, number>();
		let py = 40;
		if (showPubs) {
			for (const c of data.communities) {
				const cid = c.id.replace('community:', '');
				const pubIds = data.communityPubs.get(cid) || [];
				for (const pid of pubIds) {
					pubY.set(`pub:${pid}`, py);
					py += ROW_H;
				}
				if (pubIds.length > 0) py += 6; // gap between community groups
			}
		}

		// People column — sorted by role then name
		const personY = new Map<string, number>();
		let pey = 40;
		if (showPeople) {
			const sorted = [...data.people].sort((a, b) => {
				const roleOrder = { both: 0, manager: 1, author: 2 };
				const ra = roleOrder[a.role || 'author'] || 2;
				const rb = roleOrder[b.role || 'author'] || 2;
				if (ra !== rb) return ra - rb;
				return a.label.localeCompare(b.label);
			});
			for (const p of sorted) {
				personY.set(p.id, pey);
				pey += ROW_H;
			}
		}

		const height = Math.max(cy, py, pey) + 40;
		const width = showPeople
			? PEOPLE_COL_X + COL_WIDTH + 20
			: showPubs
				? PUB_COL_X + COL_WIDTH + 20
				: COMMUNITY_COL_X + COL_WIDTH + 20;

		return { communityY, pubY, personY, height, width };
	}, [data, showPubs, showPeople]);

	// Build connected set for highlighting
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

	const handleClick = useCallback((id: string) => {
		setSelectedId((prev) => (prev === id ? null : id));
	}, []);

	const active = selectedId || hoveredId;
	const pubColX = showPubs ? PUB_COL_X : -1;
	const peopleColX = showPubs ? PEOPLE_COL_X : showPeople ? PUB_COL_X : -1;

	// Build link paths
	const linkPaths = useMemo(() => {
		const paths: Array<{
			d: string;
			color: string;
			sourceId: string;
			targetId: string;
		}> = [];

		for (const link of data.links) {
			let x1: number | undefined;
			let y1: number | undefined;
			let x2: number | undefined;
			let y2: number | undefined;

			if (link.type === 'pub-community' && showPubs) {
				const cY = layout.communityY.get(link.target);
				const pY = layout.pubY.get(link.source);
				if (cY == null || pY == null) continue;
				x1 = COMMUNITY_COL_X + COL_WIDTH - LEFT_PAD;
				y1 = cY + ROW_H / 2;
				x2 = pubColX + LEFT_PAD;
				y2 = pY + ROW_H / 2;
			} else if (link.type === 'person-pub' && showPubs && showPeople) {
				const pY = layout.pubY.get(link.target);
				const peY = layout.personY.get(link.source);
				if (pY == null || peY == null) continue;
				x1 = pubColX + COL_WIDTH - LEFT_PAD;
				y1 = pY + ROW_H / 2;
				x2 = peopleColX + LEFT_PAD;
				y2 = peY + ROW_H / 2;
			} else if (link.type === 'person-community' && showPeople) {
				const cY = layout.communityY.get(link.target);
				const peY = layout.personY.get(link.source);
				if (cY == null || peY == null) continue;
				x1 = COMMUNITY_COL_X + COL_WIDTH - LEFT_PAD;
				y1 = cY + ROW_H / 2;
				x2 = peopleColX + LEFT_PAD;
				y2 = peY + ROW_H / 2;
			} else {
				continue;
			}

			const midX = (x1 + x2) / 2;
			const d = `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`;
			const isHighlighted =
				active && connectedIds.has(link.source) && connectedIds.has(link.target);
			const color = isHighlighted
				? 'rgba(19,124,189,0.35)'
				: active
					? 'rgba(0,0,0,0.02)'
					: link.type === 'person-community'
						? 'rgba(145,121,242,0.15)'
						: 'rgba(92,112,128,0.06)';

			paths.push({ d, color, sourceId: link.source, targetId: link.target });
		}
		return paths;
	}, [data.links, layout, showPubs, showPeople, active, connectedIds, pubColX, peopleColX]);

	return (
		<div className="hub-graph-container" style={{ overflow: 'auto' }}>
			<svg
				width={layout.width}
				height={layout.height}
				style={{ display: 'block', fontFamily: 'sans-serif' }}
			>
				{/* Column headers */}
				<text
					x={COMMUNITY_COL_X + LEFT_PAD}
					y={24}
					fontSize={12}
					fontWeight="bold"
					fill="#394b59"
				>
					Communities ({data.communities.length})
				</text>
				{showPubs && (
					<text
						x={pubColX + LEFT_PAD}
						y={24}
						fontSize={12}
						fontWeight="bold"
						fill="#394b59"
					>
						Pubs ({data.pubs.length})
					</text>
				)}
				{showPeople && (
					<text
						x={peopleColX + LEFT_PAD}
						y={24}
						fontSize={12}
						fontWeight="bold"
						fill="#394b59"
					>
						People ({data.people.length})
					</text>
				)}

				{/* Links */}
				<g>
					{linkPaths.map((lp, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static layout
						<path key={i} d={lp.d} fill="none" stroke={lp.color} strokeWidth={1} />
					))}
				</g>

				{/* Community nodes */}
				{data.communities.map((c) => {
					const y = layout.communityY.get(c.id);
					if (y == null) return null;
					const isActive = active === c.id;
					const isConnected = connectedIds.has(c.id);
					const dimmed = active && !isActive && !isConnected;
					return (
						<g
							key={c.id}
							role="button"
							tabIndex={0}
							opacity={dimmed ? 0.2 : 1}
							style={{ cursor: 'pointer' }}
							onMouseEnter={() => setHoveredId(c.id)}
							onMouseLeave={() => setHoveredId(null)}
							onClick={() => handleClick(c.id)}
						>
							<circle
								cx={COMMUNITY_COL_X + LEFT_PAD + 6}
								cy={y + ROW_H / 2}
								r={6}
								fill={COLORS.community}
								stroke={isActive ? COLORS.community : 'rgba(0,0,0,0.1)'}
								strokeWidth={isActive ? 2 : 0.5}
							/>
							<circle
								cx={COMMUNITY_COL_X + LEFT_PAD + 6}
								cy={y + ROW_H / 2}
								r={3.5}
								fill={c.accentColor || '#137cbd'}
							/>
							<text
								x={COMMUNITY_COL_X + LEFT_PAD + 18}
								y={y + ROW_H / 2}
								fontSize={11}
								fill="#394b59"
								dominantBaseline="central"
								fontWeight={isActive ? 'bold' : 'normal'}
							>
								{c.label.length > 28 ? `${c.label.slice(0, 26)}…` : c.label}
							</text>
							{c.pubCount != null && (
								<text
									x={COMMUNITY_COL_X + COL_WIDTH - LEFT_PAD}
									y={y + ROW_H / 2}
									fontSize={9}
									fill="#8a9ba8"
									dominantBaseline="central"
									textAnchor="end"
								>
									{c.pubCount}
								</text>
							)}
						</g>
					);
				})}

				{/* Pub nodes */}
				{showPubs &&
					data.pubs.map((p) => {
						const y = layout.pubY.get(p.id);
						if (y == null) return null;
						const isActive = active === p.id;
						const isConnected = connectedIds.has(p.id);
						const dimmed = active && !isActive && !isConnected;
						return (
							<g
								key={p.id}
								role="button"
								tabIndex={0}
								opacity={dimmed ? 0.15 : 1}
								style={{ cursor: 'pointer' }}
								onMouseEnter={() => setHoveredId(p.id)}
								onMouseLeave={() => setHoveredId(null)}
								onClick={() => handleClick(p.id)}
							>
								<circle
									cx={pubColX + LEFT_PAD + 4}
									cy={y + ROW_H / 2}
									r={2.5}
									fill={isActive ? '#394b59' : COLORS.pub}
								/>
								<text
									x={pubColX + LEFT_PAD + 12}
									y={y + ROW_H / 2}
									fontSize={10}
									fill={dimmed ? '#aaa' : '#5c7080'}
									dominantBaseline="central"
								>
									{p.label.length > 30 ? `${p.label.slice(0, 28)}…` : p.label}
								</text>
							</g>
						);
					})}

				{/* People nodes */}
				{showPeople &&
					data.people.map((p) => {
						const y = layout.personY.get(p.id);
						if (y == null) return null;
						const isActive = active === p.id;
						const isConnected = connectedIds.has(p.id);
						const dimmed = active && !isActive && !isConnected;
						const color =
							p.role === 'manager' || p.role === 'both'
								? COLORS.manager
								: COLORS.author;
						return (
							<g
								key={p.id}
								role="button"
								tabIndex={0}
								opacity={dimmed ? 0.15 : 1}
								style={{ cursor: 'pointer' }}
								onMouseEnter={() => setHoveredId(p.id)}
								onMouseLeave={() => setHoveredId(null)}
								onClick={() => handleClick(p.id)}
							>
								<circle
									cx={peopleColX + LEFT_PAD + 4}
									cy={y + ROW_H / 2}
									r={3}
									fill={isActive ? '#fff' : color}
									stroke={isActive ? color : 'none'}
									strokeWidth={isActive ? 1.5 : 0}
								/>
								<text
									x={peopleColX + LEFT_PAD + 12}
									y={y + ROW_H / 2}
									fontSize={10}
									fill={dimmed ? '#aaa' : '#5c7080'}
									dominantBaseline="central"
								>
									{p.label}
								</text>
								{p.role && (
									<text
										x={peopleColX + COL_WIDTH - LEFT_PAD}
										y={y + ROW_H / 2}
										fontSize={8}
										fill="#8a9ba8"
										dominantBaseline="central"
										textAnchor="end"
									>
										{p.role}
									</text>
								)}
							</g>
						);
					})}
			</svg>
		</div>
	);
};

export default HubGraphBipartite;
