import type { GraphData } from './hubGraphData';

import React, { useCallback, useMemo, useState } from 'react';

import { COLORS } from './hubGraphData';

type Props = { data: GraphData };

const CELL_SIZE = 28;
const LABEL_WIDTH = 180;
const HEADER_HEIGHT = 200;

const HubGraphMatrix = ({ data }: Props) => {
	const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
	const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

	const matrix = useMemo(() => {
		const communities = data.communities;
		const n = communities.length;

		// Build overlap matrix
		const cells: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
		const cellNames: string[][][] = Array.from({ length: n }, () =>
			Array.from({ length: n }, () => []),
		);

		const cidToIdx = new Map<string, number>();
		for (let i = 0; i < communities.length; i++) {
			cidToIdx.set(communities[i].id.replace('community:', ''), i);
		}

		for (const [key, names] of data.communityOverlap) {
			const [a, b] = key.split('|');
			const ai = cidToIdx.get(a);
			const bi = cidToIdx.get(b);
			if (ai != null && bi != null) {
				cells[ai][bi] = names.length;
				cells[bi][ai] = names.length;
				cellNames[ai][bi] = names;
				cellNames[bi][ai] = names;
			}
		}

		// Diagonal: number of people in that community
		for (let i = 0; i < n; i++) {
			const cid = communities[i].id.replace('community:', '');
			let count = 0;
			for (const [, cids] of data.personCommunities) {
				if (cids.has(cid)) count++;
			}
			cells[i][i] = count;
		}

		// Max for color scale
		let maxVal = 1;
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < n; j++) {
				if (i !== j && cells[i][j] > maxVal) maxVal = cells[i][j];
			}
		}

		return { communities, cells, cellNames, maxVal, n };
	}, [data]);

	const active = selectedCell || hoveredCell;

	const handleCellClick = useCallback((row: number, col: number) => {
		setSelectedCell((prev) =>
			prev && prev.row === row && prev.col === col ? null : { row, col },
		);
	}, []);

	const width = LABEL_WIDTH + matrix.n * CELL_SIZE + 20;
	const height = HEADER_HEIGHT + matrix.n * CELL_SIZE + 40;

	return (
		<div className="hub-graph-container" style={{ overflow: 'auto' }}>
			<svg
				width={width}
				height={height}
				style={{ display: 'block', fontFamily: 'sans-serif' }}
			>
				{/* Column headers (rotated) */}
				{matrix.communities.map((c, i) => {
					const x = LABEL_WIDTH + i * CELL_SIZE + CELL_SIZE / 2;
					const isHighlighted = active && (active.col === i || active.row === i);
					return (
						<g key={`ch-${c.id}`}>
							<text
								x={0}
								y={0}
								transform={`translate(${x}, ${HEADER_HEIGHT - 8}) rotate(-55)`}
								fontSize={10}
								fill={isHighlighted ? '#137cbd' : '#394b59'}
								fontWeight={isHighlighted ? 'bold' : 'normal'}
								textAnchor="start"
								dominantBaseline="central"
							>
								{c.label.length > 24 ? `${c.label.slice(0, 22)}…` : c.label}
							</text>
							{/* Accent dot */}
							<circle
								cx={x}
								cy={HEADER_HEIGHT}
								r={3}
								fill={c.accentColor || '#137cbd'}
							/>
						</g>
					);
				})}

				{/* Row labels + cells */}
				{matrix.communities.map((c, row) => {
					const y = HEADER_HEIGHT + 8 + row * CELL_SIZE;
					const isHighlighted = active && (active.row === row || active.col === row);
					return (
						<g key={`row-${c.id}`}>
							{/* Row accent dot */}
							<circle
								cx={LABEL_WIDTH - 10}
								cy={y + CELL_SIZE / 2}
								r={3}
								fill={c.accentColor || '#137cbd'}
							/>
							{/* Row label */}
							<text
								x={LABEL_WIDTH - 18}
								y={y + CELL_SIZE / 2}
								fontSize={10}
								fill={isHighlighted ? '#137cbd' : '#394b59'}
								fontWeight={isHighlighted ? 'bold' : 'normal'}
								textAnchor="end"
								dominantBaseline="central"
							>
								{c.label.length > 22 ? `${c.label.slice(0, 20)}…` : c.label}
							</text>
							{/* Cells */}
							{matrix.cells[row].map((val, col) => {
								const cx = LABEL_WIDTH + col * CELL_SIZE;
								const isDiag = row === col;
								const isCellActive =
									active && active.row === row && active.col === col;
								const isRowOrCol =
									active && (active.row === row || active.col === col);

								let fill: string;
								if (val === 0 && !isDiag) {
									fill = '#f5f8fa';
								} else if (isDiag) {
									fill = `rgba(92,112,128,${Math.min(val / 30, 0.4) + 0.05})`;
								} else {
									const intensity = Math.min(val / matrix.maxVal, 1);
									fill = `rgba(19,124,189,${intensity * 0.7 + 0.05})`;
								}

								return (
									<g
										// biome-ignore lint/suspicious/noArrayIndexKey: matrix grid
										key={col}
										role="button"
										tabIndex={0}
										style={{ cursor: val > 0 ? 'pointer' : 'default' }}
										onMouseEnter={() => setHoveredCell({ row, col })}
										onMouseLeave={() => setHoveredCell(null)}
										onClick={() => val > 0 && handleCellClick(row, col)}
									>
										<rect
											x={cx + 1}
											y={y + 1}
											width={CELL_SIZE - 2}
											height={CELL_SIZE - 2}
											rx={3}
											fill={fill}
											stroke={
												isCellActive
													? '#137cbd'
													: isRowOrCol
														? 'rgba(19,124,189,0.3)'
														: 'rgba(0,0,0,0.04)'
											}
											strokeWidth={isCellActive ? 2 : 0.5}
										/>
										{val > 0 && (
											<text
												x={cx + CELL_SIZE / 2}
												y={y + CELL_SIZE / 2}
												fontSize={val > 99 ? 7 : 9}
												fill={
													val / matrix.maxVal > 0.5 && !isDiag
														? '#fff'
														: '#5c7080'
												}
												textAnchor="middle"
												dominantBaseline="central"
											>
												{val}
											</text>
										)}
									</g>
								);
							})}
						</g>
					);
				})}
			</svg>

			{/* Detail panel */}
			{active && matrix.cells[active.row][active.col] > 0 && (
				<div className="hub-graph-info" style={{ position: 'sticky', bottom: 0 }}>
					<div className="hub-graph-info-title">
						{active.row === active.col ? (
							<strong>{matrix.communities[active.row].label}</strong>
						) : (
							<strong>
								{matrix.communities[active.row].label} ↔{' '}
								{matrix.communities[active.col].label}
							</strong>
						)}
					</div>
					<div className="hub-graph-info-meta">
						{active.row === active.col
							? `${matrix.cells[active.row][active.col]} people in this community`
							: `${matrix.cells[active.row][active.col]} shared people`}
					</div>
					{active.row !== active.col &&
						matrix.cellNames[active.row][active.col].length > 0 && (
							<ul className="hub-graph-info-list">
								{matrix.cellNames[active.row][active.col]
									.slice(0, 10)
									.map((name) => (
										<li key={name}>{name}</li>
									))}
								{matrix.cellNames[active.row][active.col].length > 10 && (
									<li>
										…and {matrix.cellNames[active.row][active.col].length - 10}{' '}
										more
									</li>
								)}
							</ul>
						)}
				</div>
			)}
		</div>
	);
};

export default HubGraphMatrix;
