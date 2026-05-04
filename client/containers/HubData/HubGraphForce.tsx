import type { GraphData, GraphLink, GraphNode } from './hubGraphData';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { NonIdealState, Spinner } from '@blueprintjs/core';

import { COLORS } from './hubGraphData';

type Props = { data: GraphData; showPubs: boolean; showPeople: boolean };

const EDGE_DEFAULT: Record<string, string> = {
	'pub-community': 'rgba(92,112,128,0.15)',
	'person-pub': 'rgba(217,130,43,0.25)',
	'person-community': 'rgba(145,121,242,0.25)',
};
const EDGE_HIGHLIGHT = 'rgba(19,124,189,0.55)';
const EDGE_DIM = 'rgba(0,0,0,0.02)';

const HubGraphForce = ({ data, showPubs, showPeople }: Props) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const graphRef = useRef<any>(undefined);
	const [ForceGraph, setForceGraph] = useState<any>(null);
	const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
	const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
	const [highlightedNeighbors, setHighlightedNeighbors] = useState<Set<string>>(new Set());

	useEffect(() => {
		let cancelled = false;
		import('react-force-graph-2d').then((mod) => {
			if (!cancelled) setForceGraph(() => mod.default);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const obs = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				setDimensions({
					width: entry.contentRect.width,
					height: Math.max(entry.contentRect.height, 500),
				});
			}
		});
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	const filteredData = useMemo(() => {
		const visibleTypes = new Set<string>(['community']);
		if (showPubs) visibleTypes.add('pub');
		if (showPeople) visibleTypes.add('person');
		const nodeSet = new Set(
			data.nodes.filter((n) => visibleTypes.has(n.type)).map((n) => n.id),
		);
		return {
			nodes: data.nodes.filter((n) => nodeSet.has(n.id)),
			links: data.links.filter((l) => nodeSet.has(l.source) && nodeSet.has(l.target)),
		};
	}, [data, showPubs, showPeople]);

	const graphData = useMemo(
		() => ({
			nodes: filteredData.nodes.map((n) => ({ ...n })),
			links: filteredData.links.map((l) => ({ ...l })),
		}),
		[filteredData],
	);

	const neighborMap = useMemo(() => {
		const map = new Map<string, Set<string>>();
		for (const link of filteredData.links) {
			const s = typeof link.source === 'string' ? link.source : (link.source as any).id;
			const t = typeof link.target === 'string' ? link.target : (link.target as any).id;
			if (!map.has(s)) map.set(s, new Set());
			if (!map.has(t)) map.set(t, new Set());
			map.get(s)!.add(t);
			map.get(t)!.add(s);
		}
		return map;
	}, [filteredData]);

	const handleNodeClick = useCallback(
		(node: any) => {
			const id = node.id as string;
			if (highlightedNode === id) {
				setHighlightedNode(null);
				setHighlightedNeighbors(new Set());
			} else {
				setHighlightedNode(id);
				setHighlightedNeighbors(neighborMap.get(id) || new Set());
			}
		},
		[highlightedNode, neighborMap],
	);

	const handleBackgroundClick = useCallback(() => {
		setHighlightedNode(null);
		setHighlightedNeighbors(new Set());
	}, []);

	const nodeCanvasObject = useCallback(
		(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
			const gNode = node as GraphNode;
			const id = node.id as string;
			const isHighlighted = highlightedNode === id;
			const isNeighbor = highlightedNeighbors.has(id);
			const isDimmed = highlightedNode !== null && !isHighlighted && !isNeighbor;
			ctx.globalAlpha = isDimmed ? 0.1 : 1;

			const logSize =
				gNode.type === 'community' && gNode.pubCount ? Math.log2(gNode.pubCount + 1) : 0;
			const size =
				gNode.type === 'community'
					? 4 + logSize * 1.2
					: gNode.type === 'pub'
						? 3
						: gNode.role === 'both'
							? 5.5
							: gNode.role === 'manager'
								? 5
								: 4.5;

			if (gNode.type === 'community') {
				ctx.beginPath();
				ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
				ctx.fillStyle = isHighlighted ? '#fff' : COLORS.community;
				ctx.fill();
				ctx.strokeStyle = isHighlighted ? COLORS.community : 'rgba(0,0,0,0.12)';
				ctx.lineWidth = isHighlighted ? 2 : 0.5;
				ctx.stroke();
				const innerR = size * 0.55;
				ctx.beginPath();
				ctx.arc(node.x!, node.y!, innerR, 0, 2 * Math.PI);
				ctx.fillStyle = gNode.accentColor || '#137cbd';
				ctx.fill();
			} else if (gNode.type === 'pub') {
				ctx.beginPath();
				ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
				ctx.fillStyle = isHighlighted ? '#394b59' : COLORS.pub;
				ctx.fill();
			} else {
				const color = gNode.role === 'manager' ? COLORS.manager : COLORS.author;
				ctx.beginPath();
				ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
				ctx.fillStyle = isHighlighted ? '#fff' : color;
				ctx.fill();
				if (isHighlighted) {
					ctx.strokeStyle = color;
					ctx.lineWidth = 1.5;
					ctx.stroke();
				}
			}

			const isCommunity = gNode.type === 'community';
			const isPerson = gNode.type === 'person';
			const showLabel =
				isCommunity ||
				isHighlighted ||
				(isNeighbor && (isCommunity || isPerson)) ||
				(isPerson && globalScale > 2.5) ||
				globalScale > 4;

			if (showLabel) {
				const fontSize = isCommunity
					? Math.max(11 / globalScale, 2)
					: Math.max(9 / globalScale, 1.5);
				ctx.font = `${fontSize}px sans-serif`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'top';
				ctx.fillStyle = isDimmed ? 'rgba(0,0,0,0.1)' : '#394b59';
				const maxLen = isCommunity ? 35 : 25;
				const label =
					gNode.label.length > maxLen
						? `${gNode.label.slice(0, maxLen - 2)}…`
						: gNode.label;
				ctx.fillText(label, node.x!, node.y! + size + 1.5);
			}
			ctx.globalAlpha = 1;
		},
		[highlightedNode, highlightedNeighbors],
	);

	const linkColorFn = useCallback(
		(link: any) => {
			if (highlightedNode === null)
				return EDGE_DEFAULT[(link as GraphLink).type] || EDGE_DEFAULT['pub-community'];
			const s = typeof link.source === 'string' ? link.source : link.source?.id;
			const t = typeof link.target === 'string' ? link.target : link.target?.id;
			if (s === highlightedNode || t === highlightedNode) return EDGE_HIGHLIGHT;
			return EDGE_DIM;
		},
		[highlightedNode],
	);

	const linkWidthFn = useCallback(
		(link: any) => ((link as GraphLink).type === 'person-community' ? 1.2 : 0.8),
		[],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-run when ForceGraph loads or data changes
	useEffect(() => {
		const fg = graphRef.current;
		if (!fg) return;
		fg.d3Force('charge')?.strength(-120).distanceMax(300);
		fg.d3Force('link')?.distance((link: GraphLink) => {
			if (link.type === 'pub-community') return 20;
			if (link.type === 'person-pub') return 30;
			return 60;
		});
		fg.d3Force('center')?.strength(0.05);
		fg.d3ReheatSimulation();
	}, [ForceGraph, graphData]);

	useEffect(() => {
		const timer = setTimeout(() => {
			graphRef.current?.zoomToFit(600, 40);
		}, 1500);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="hub-graph-container" ref={containerRef}>
			{highlightedNode && (
				<div className="hub-graph-info">
					{(() => {
						const node = filteredData.nodes.find((n) => n.id === highlightedNode);
						if (!node) return null;
						const neighbors = [...highlightedNeighbors]
							.map((nid) => filteredData.nodes.find((n) => n.id === nid))
							.filter(Boolean) as GraphNode[];
						const byType = (t: string) => neighbors.filter((n) => n.type === t);
						return (
							<>
								<div className="hub-graph-info-title">
									<strong>{node.label}</strong>
								</div>
								{node.type === 'community' && node.pubCount != null && (
									<div className="hub-graph-info-meta">
										{node.pubCount.toLocaleString()} pubs total
									</div>
								)}
								{node.type === 'person' && node.role && (
									<div className="hub-graph-info-meta">{node.role}</div>
								)}
								{byType('community').length > 0 && (
									<div className="hub-graph-info-connections">
										{byType('community').length} communit
										{byType('community').length !== 1 ? 'ies' : 'y'}
										<ul className="hub-graph-info-list">
											{byType('community')
												.slice(0, 6)
												.map((n) => (
													<li key={n.id}>{n.label}</li>
												))}
										</ul>
									</div>
								)}
								{byType('pub').length > 0 && (
									<div className="hub-graph-info-connections">
										{byType('pub').length} pub
										{byType('pub').length !== 1 ? 's' : ''}
									</div>
								)}
								{byType('person').length > 0 && (
									<div className="hub-graph-info-connections">
										{byType('person').length}{' '}
										{byType('person').length !== 1 ? 'people' : 'person'}
									</div>
								)}
							</>
						);
					})()}
				</div>
			)}
			{ForceGraph ? (
				<ForceGraph
					ref={graphRef}
					graphData={graphData}
					width={dimensions.width}
					height={dimensions.height}
					nodeCanvasObject={nodeCanvasObject}
					nodePointerAreaPaint={(
						node: any,
						color: string,
						ctx: CanvasRenderingContext2D,
					) => {
						ctx.beginPath();
						ctx.arc(node.x!, node.y!, 6, 0, 2 * Math.PI);
						ctx.fillStyle = color;
						ctx.fill();
					}}
					linkColor={linkColorFn}
					linkWidth={linkWidthFn}
					onNodeClick={handleNodeClick}
					onBackgroundClick={handleBackgroundClick}
					cooldownTicks={200}
					enableNodeDrag
					d3AlphaDecay={0.02}
					d3VelocityDecay={0.3}
				/>
			) : (
				<NonIdealState icon={<Spinner size={30} />} title="Loading graph…" />
			)}
		</div>
	);
};

export default HubGraphForce;
