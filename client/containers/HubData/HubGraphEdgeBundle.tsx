import type { GraphData, GraphNode } from './hubGraphData';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cluster, hierarchy } from 'd3-hierarchy';

import { COLORS } from './hubGraphData';

type Props = { data: GraphData; showPubs: boolean; showPeople: boolean };

type HierNode = {
	name: string;
	id: string;
	type: GraphNode['type'];
	role?: string;
	accentColor?: string;
	pubCount?: number;
	children?: HierNode[];
};

const HubGraphEdgeBundle = ({ data, showPubs, showPeople }: Props) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
	const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const obs = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				setDimensions({
					width: entry.contentRect.width,
					height: entry.contentRect.height,
				});
			}
		});
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	const layoutData = useMemo(() => {
		// Build hierarchy: root → communities → [pubs, people]
		const root: HierNode = { name: 'root', id: 'root', type: 'community', children: [] };

		for (const c of data.communities) {
			const communityNode: HierNode = {
				name: c.label,
				id: c.id,
				type: 'community',
				accentColor: c.accentColor,
				pubCount: c.pubCount,
				children: [],
			};

			const cid = c.id.replace('community:', '');

			if (showPubs) {
				const pubIds = data.communityPubs.get(cid) || [];
				for (const pid of pubIds) {
					const pubNode = data.pubs.find((p) => p.id === `pub:${pid}`);
					if (pubNode) {
						communityNode.children!.push({
							name: pubNode.label,
							id: pubNode.id,
							type: 'pub',
						});
					}
				}
			}

			if (showPeople) {
				for (const person of data.people) {
					const personCids = data.personCommunities.get(person.id);
					if (personCids?.has(cid)) {
						// Only add person under their "primary" community (first alphabetically)
						const sorted = [...personCids].sort();
						if (sorted[0] === cid) {
							communityNode.children!.push({
								name: person.label,
								id: person.id,
								type: 'person',
								role: person.role,
							});
						}
					}
				}
			}

			// Add padding leaves if community has no children so it still renders
			if (communityNode.children!.length === 0) {
				communityNode.children!.push({
					name: '',
					id: `_pad:${c.id}`,
					type: 'pub',
				});
			}

			root.children!.push(communityNode);
		}

		const h = hierarchy(root);
		const size = Math.min(dimensions.width, dimensions.height);
		const radius = size / 2 - 100;
		const cl = cluster<HierNode>()
			.size([2 * Math.PI, radius])
			.separation(() => 1);
		cl(h);

		// Convert polar to cartesian for all positioned nodes
		const posMap = new Map<string, { x: number; y: number; angle: number }>();
		for (const leaf of h.leaves()) {
			const d = leaf.data;
			if (d.id.startsWith('_pad:')) continue;
			const angle = leaf.x!;
			const r = leaf.y!;
			posMap.set(d.id, {
				x: r * Math.cos(angle - Math.PI / 2),
				y: r * Math.sin(angle - Math.PI / 2),
				angle,
			});
		}
		for (const node of h.descendants().filter((d) => d.depth === 1)) {
			const angle = node.x!;
			const r = radius + 16;
			posMap.set(node.data.id, {
				x: r * Math.cos(angle - Math.PI / 2),
				y: r * Math.sin(angle - Math.PI / 2),
				angle,
			});
		}

		const edges: Array<{ source: string; target: string }> = [];

		if (showPeople) {
			for (const person of data.people) {
				const cids = data.personCommunities.get(person.id);
				if (!cids || cids.size < 2) continue;
				if (!posMap.has(person.id)) continue;
				for (const cid of cids) {
					const targetId = `community:${cid}`;
					if (posMap.has(targetId)) {
						edges.push({ source: person.id, target: targetId });
					}
				}
			}
		}

		return { hierarchy: h, posMap, edges, radius, size };
	}, [data, showPubs, showPeople, dimensions]);

	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { hierarchy: h, posMap, edges, size } = layoutData;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = size * dpr;
		canvas.height = size * dpr;
		canvas.style.width = `${size}px`;
		canvas.style.height = `${size}px`;
		ctx.scale(dpr, dpr);

		const cx = size / 2;
		const cy = size / 2;

		ctx.clearRect(0, 0, size * dpr, size * dpr);
		ctx.save();
		ctx.translate(cx, cy);

		// Draw edges as quadratic beziers through center
		const BUNDLE_TENSION = 0.7;
		for (const edge of edges) {
			const sp = posMap.get(edge.source);
			const tp = posMap.get(edge.target);
			if (!sp || !tp) continue;

			const cpX = ((1 - BUNDLE_TENSION) * (sp.x + tp.x)) / 2;
			const cpY = ((1 - BUNDLE_TENSION) * (sp.y + tp.y)) / 2;

			ctx.beginPath();
			ctx.moveTo(sp.x, sp.y);
			ctx.quadraticCurveTo(cpX, cpY, tp.x, tp.y);

			const isHovered = hoveredId === edge.source || hoveredId === edge.target;
			ctx.strokeStyle = isHovered
				? 'rgba(19,124,189,0.5)'
				: hoveredId
					? 'rgba(0,0,0,0.02)'
					: 'rgba(145,121,242,0.18)';
			ctx.lineWidth = isHovered ? 2 : 0.7;
			ctx.stroke();
		}

		// Draw leaf nodes
		for (const leaf of h.leaves()) {
			const d = leaf.data;
			if (d.id.startsWith('_pad:')) continue;
			const pos = posMap.get(d.id);
			if (!pos) continue;
			const isHovered = hoveredId === d.id;

			if (d.type === 'pub') {
				ctx.beginPath();
				ctx.arc(pos.x, pos.y, 2, 0, 2 * Math.PI);
				ctx.fillStyle = isHovered ? '#394b59' : COLORS.pub;
				ctx.fill();
			} else if (d.type === 'person') {
				const color = d.role === 'manager' ? COLORS.manager : COLORS.author;
				ctx.beginPath();
				ctx.arc(pos.x, pos.y, 3, 0, 2 * Math.PI);
				ctx.fillStyle = isHovered ? '#fff' : color;
				ctx.fill();
				if (isHovered) {
					ctx.strokeStyle = color;
					ctx.lineWidth = 1.5;
					ctx.stroke();
				}
			}
		}

		// Draw community group nodes
		for (const node of h.descendants().filter((d) => d.depth === 1)) {
			const d = node.data;
			const pos = posMap.get(d.id);
			if (!pos) continue;
			const isHovered = hoveredId === d.id;

			ctx.beginPath();
			ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
			ctx.fillStyle = isHovered ? '#fff' : COLORS.community;
			ctx.fill();
			ctx.strokeStyle = isHovered ? COLORS.community : 'rgba(0,0,0,0.15)';
			ctx.lineWidth = isHovered ? 2 : 0.5;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, 3.5, 0, 2 * Math.PI);
			ctx.fillStyle = d.accentColor || '#137cbd';
			ctx.fill();

			ctx.save();
			ctx.translate(pos.x, pos.y);
			const rotAngle = pos.angle - Math.PI / 2;
			const flip = rotAngle > Math.PI / 2 && rotAngle < (3 * Math.PI) / 2;
			ctx.rotate(flip ? rotAngle + Math.PI : rotAngle);
			ctx.font = `10px sans-serif`;
			ctx.textAlign = flip ? 'right' : 'left';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = '#394b59';
			const labelX = flip ? -11 : 11;
			const label = d.name.length > 28 ? `${d.name.slice(0, 26)}…` : d.name;
			ctx.fillText(label, labelX, 0);
			ctx.restore();
		}

		ctx.restore();
	}, [layoutData, hoveredId]);

	useEffect(() => {
		draw();
	}, [draw]);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const { size, posMap } = layoutData;
			const scale = size / rect.width;
			const mx = (e.clientX - rect.left) * scale - size / 2;
			const my = (e.clientY - rect.top) * scale - size / 2;

			let closest: { id: string; dist: number; node: GraphNode } | null = null;

			for (const [id, pos] of posMap) {
				const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2);
				const hitRadius = id.startsWith('community:') ? 12 : 8;
				if (dist < hitRadius && (!closest || dist < closest.dist)) {
					const gn = data.nodes.find((n) => n.id === id);
					if (gn) closest = { id, dist, node: gn };
				}
			}

			if (closest) {
				setHoveredId(closest.id);
				setTooltip({
					x: e.clientX - rect.left,
					y: e.clientY - rect.top,
					node: closest.node,
				});
			} else {
				setHoveredId(null);
				setTooltip(null);
			}
		},
		[layoutData, data],
	);

	const handleMouseLeave = useCallback(() => {
		setHoveredId(null);
		setTooltip(null);
	}, []);

	return (
		<div className="hub-graph-container" ref={containerRef}>
			<canvas
				ref={canvasRef}
				style={{ display: 'block', margin: '0 auto' }}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
			/>
			{tooltip && (
				<div
					className="hub-graph-info"
					style={{ left: tooltip.x + 12, top: tooltip.y - 10, position: 'absolute' }}
				>
					<div className="hub-graph-info-title">
						<strong>{tooltip.node.label}</strong>
					</div>
					<div className="hub-graph-info-meta">
						{tooltip.node.type}
						{tooltip.node.role ? ` · ${tooltip.node.role}` : ''}
						{tooltip.node.pubCount != null
							? ` · ${tooltip.node.pubCount.toLocaleString()} pubs`
							: ''}
					</div>
				</div>
			)}
		</div>
	);
};

export default HubGraphEdgeBundle;
