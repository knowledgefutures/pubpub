import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
	Button,
	Callout,
	Checkbox,
	Collapse,
	HTMLTable,
	Spinner,
	Tag,
	Tooltip,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';

import './exportCollectionButton.scss';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

type PastExport = {
	id: string;
	createdAt: string;
	isProcessing: boolean;
	output: {
		downloadUrl: string;
		ftpTargetResults?: { id: string; host: string; uploaded: boolean; error?: string }[];
		skippedPubs?: string[];
		partialPubs?: { slug: string; missingFormats: string[] }[];
	} | null;
	error: string | null;
};

const normalizeError = (err: unknown): string => {
	if (!err) return '';
	if (typeof err === 'string') return err;
	if (typeof err === 'object') {
		const msg = (err as any).message ?? (err as any).error;
		if (msg) return String(msg);
		const json = JSON.stringify(err);
		return json === '{}' ? 'An unknown error occurred.' : json;
	}
	return String(err);
};

type FtpTargetOption = {
	id: string;
	name: string | null;
	host: string;
	filePath: string | null;
	ftpType: string;
};

type Props = {
	pastExports: PastExport[];
	ftpTargets: FtpTargetOption[];
};

export const ExportCollectionButton = ({ pastExports: initialExports, ftpTargets }: Props) => {
	const {
		scopeData: {
			elements: { activeCollection },
		},
	} = usePageContext();

	const [isRequesting, setIsRequesting] = useState(false);
	const [activeWorkerTaskId, setActiveWorkerTaskId] = useState<string | null>(null);
	const [exports, setExports] = useState<PastExport[]>(initialExports ?? []);
	const [error, setError] = useState<string | null>(null);
	const [warning, setWarning] = useState<React.ReactNode | null>(null);
	const [selectedFtpTargetIds, setSelectedFtpTargetIds] = useState<Set<string>>(new Set());
	const [historyOpen, setHistoryOpen] = useState(false);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pollErrorCountRef = useRef(0);

	const clearPoll = () => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	};

	useEffect(() => {
		const inProgress = initialExports.find((e) => e.isProcessing);
		if (inProgress) {
			setActiveWorkerTaskId(inProgress.id);
		}
	}, [initialExports]);

	useEffect(() => {
		if (!activeWorkerTaskId) {
			clearPoll();
			return;
		}
		pollErrorCountRef.current = 0;
		pollRef.current = setInterval(async () => {
			try {
				const task = await apiFetch(`/api/workerTasks?workerTaskId=${activeWorkerTaskId}`);
				pollErrorCountRef.current = 0;
				if (!task.isProcessing) {
					clearPoll();
					setActiveWorkerTaskId(null);
					const errMsg = task.error ? normalizeError(task.error) : null;
					if (errMsg) {
						setError(errMsg);
					} else {
						const skipped: string[] = task.output?.skippedPubs ?? [];
						const partial: { slug: string; missingFormats: string[] }[] =
							task.output?.partialPubs ?? [];
						const failedFtp = (task.output?.ftpTargetResults ?? []).filter(
							(r: { uploaded: boolean }) => !r.uploaded,
						);
						if (skipped.length > 0 || partial.length > 0 || failedFtp.length > 0) {
							setWarning(
								<>
									{skipped.length > 0 && (
										<p style={{ margin: 0 }}>
											<strong>
												{skipped.length === 1
													? '1 pub was skipped'
													: `${skipped.length} pubs were skipped`}
											</strong>{' '}
											(no files found): {skipped.join(', ')}
										</p>
									)}
									{partial.length > 0 && (
										<p style={{ margin: skipped.length > 0 ? '6px 0 0' : 0 }}>
											<strong>
												{partial.length === 1
													? '1 pub is missing files'
													: `${partial.length} pubs are missing files`}
											</strong>
											:{' '}
											{partial
												.map(
													({ slug, missingFormats }) =>
														`${slug} (missing ${missingFormats.join(', ')})`,
												)
												.join('; ')}
										</p>
									)}
									{failedFtp.length > 0 && (
										<p
											style={{
												margin:
													skipped.length > 0 || partial.length > 0
														? '6px 0 0'
														: 0,
											}}
										>
											<strong>
												{failedFtp.length === 1
													? '1 FTP upload failed'
													: `${failedFtp.length} FTP uploads failed`}
											</strong>
											:{' '}
											{failedFtp
												.map(
													(r: { host: string; error?: string }) =>
														`${r.host}${r.error ? ` (${r.error})` : ''}`,
												)
												.join(', ')}
										</p>
									)}
								</>,
							);
						}
					}
					setExports((prev) =>
						prev.map((e) =>
							e.id === activeWorkerTaskId
								? {
										...e,
										isProcessing: false,
										output: task.output ?? null,
										error: errMsg,
									}
								: e,
						),
					);
				}
			} catch (e: any) {
				// Stop polling if task is definitively not found
				if (e?.error === 'WorkerTask not found') {
					clearPoll();
					setActiveWorkerTaskId(null);
					setError('Export task not found. The export may have failed to start.');
					setExports((prev) =>
						prev.map((exp) =>
							exp.id === activeWorkerTaskId
								? { ...exp, isProcessing: false, error: 'Task not found' }
								: exp,
						),
					);
					return;
				}
				// Stop after 5 consecutive transient failures
				pollErrorCountRef.current += 1;
				if (pollErrorCountRef.current >= 5) {
					clearPoll();
					setActiveWorkerTaskId(null);
					setError('Lost connection while waiting for export. Please refresh the page.');
				}
			}
		}, POLL_INTERVAL_MS);
		return clearPoll;
	}, [activeWorkerTaskId]);

	const startExport = useCallback(async () => {
		if (!activeCollection) return;
		setIsRequesting(true);
		setError(null);
		setWarning(null);
		try {
			const body: { collectionId: string; ftpTargetIds?: string[] } = {
				collectionId: activeCollection.id,
			};
			if (selectedFtpTargetIds.size > 0) body.ftpTargetIds = Array.from(selectedFtpTargetIds);
			const response = await apiFetch('/api/collections/export', {
				method: 'POST',
				body: JSON.stringify(body),
			});
			const newExport: PastExport = {
				id: response.workerTaskId,
				createdAt: new Date().toISOString(),
				isProcessing: true,
				output: null,
				error: null,
			};
			setExports((prev) => [newExport, ...prev]);
			setActiveWorkerTaskId(response.workerTaskId);
		} catch (e: any) {
			const msg =
				e instanceof Error ? e.message : 'Something went wrong, please try again later.';
			setError(msg);
		} finally {
			setIsRequesting(false);
		}
	}, [activeCollection, selectedFtpTargetIds]);

	const hasInProgress = exports.some((e) => e.isProcessing);
	const isButtonDisabled = isRequesting || hasInProgress || !activeCollection;

	return (
		<div className="export-collection-button-component">
			<div className="export-controls">
				<Button
					disabled={isButtonDisabled}
					onClick={startExport}
					intent="primary"
					icon={hasInProgress ? undefined : 'export'}
				>
					{isRequesting ? (
						<>
							Starting...{' '}
							<span
								style={{
									display: 'inline-block',
									marginLeft: 4,
									verticalAlign: 'middle',
								}}
							>
								<Spinner size={16} />
							</span>
						</>
					) : hasInProgress ? (
						<>
							Export in progress...{' '}
							<span
								style={{
									display: 'inline-block',
									marginLeft: 4,
									verticalAlign: 'middle',
								}}
							>
								<Spinner size={16} />
							</span>
						</>
					) : (
						'Export Collection'
					)}
				</Button>
				{ftpTargets.length > 0 && (
					<div className="ftp-target-selection">
						<span className="ftp-target-label">Also upload to FTP:</span>
						{ftpTargets.map((t) => (
							<Checkbox
								key={t.id}
								label={t.name || `${t.host}${t.filePath ? ` (${t.filePath})` : ''}`}
								checked={selectedFtpTargetIds.has(t.id)}
								disabled={isButtonDisabled}
								onChange={(e) => {
									const checked = (e.target as HTMLInputElement).checked;
									setSelectedFtpTargetIds((prev) => {
										const next = new Set(prev);
										if (checked) next.add(t.id);
										else next.delete(t.id);
										return next;
									});
								}}
							/>
						))}
					</div>
				)}
			</div>

			{error && (
				<Callout intent="danger" style={{ marginTop: 12 }}>
					{error}
				</Callout>
			)}
			{warning && (
				<Callout intent="warning" style={{ marginTop: 12 }}>
					{warning}
				</Callout>
			)}

			{exports.length > 0 && (
				<div className="export-history">
					<button
						type="button"
						className="history-toggle"
						onClick={() => setHistoryOpen((o) => !o)}
					>
						{historyOpen ? '▾' : '▸'} Export history ({exports.length})
					</button>
					<Collapse isOpen={historyOpen}>
						<HTMLTable condensed striped style={{ width: '100%', marginTop: 8 }}>
							<thead>
								<tr>
									<th>Date</th>
									<th>Status</th>
									<th>FTP</th>
									<th>Files</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{exports.map((exportItem) => {
									const createdAt = new Date(exportItem.createdAt);
									const expiresAt = new Date(createdAt.getTime() + SEVEN_DAYS_MS);
									const isExpired = Date.now() > expiresAt.getTime();
									const downloadUrl = exportItem.output?.downloadUrl ?? null;
									const hasUrl =
										!exportItem.isProcessing &&
										!exportItem.error &&
										downloadUrl !== null;

									let status: React.ReactNode;
									if (exportItem.isProcessing) {
										status = (
											<Tag minimal intent="primary">
												Processing
											</Tag>
										);
									} else if (exportItem.error) {
										status = (
											<Tag
												minimal
												intent="danger"
												title={normalizeError(exportItem.error)}
											>
												Error
											</Tag>
										);
									} else if (isExpired) {
										status = (
											<Tag minimal intent="warning">
												Expired
											</Tag>
										);
									} else {
										status = (
											<Tag minimal intent="success">
												Ready
											</Tag>
										);
									}

									const itemSkipped = exportItem.output?.skippedPubs ?? [];
									const itemPartial = exportItem.output?.partialPubs ?? [];
									const hasFileWarnings =
										itemSkipped.length > 0 || itemPartial.length > 0;
									const fileWarningContent = hasFileWarnings ? (
										<>
											{itemSkipped.length > 0 && (
												<div>
													<strong>Skipped (no files):</strong>{' '}
													{itemSkipped.join(', ')}
												</div>
											)}
											{itemPartial.length > 0 && (
												<div>
													<strong>Missing files:</strong>{' '}
													{itemPartial
														.map(
															({ slug, missingFormats }) =>
																`${slug} (${missingFormats.join(', ')})`,
														)
														.join('; ')}
												</div>
											)}
										</>
									) : null;

									return (
										<tr key={exportItem.id}>
											<td>{createdAt.toLocaleString()}</td>
											<td>{status}</td>
											<td>
												{(() => {
													const results =
														exportItem.output?.ftpTargetResults ?? [];
													if (results.length === 0) return '—';
													const failed = results.filter(
														(r) => !r.uploaded,
													);
													const tooltipContent = (
														<>
															{results.map((r) => (
																<div key={r.id}>
																	{r.uploaded ? '✓' : '✗'}{' '}
																	{r.host}
																	{r.error ? `: ${r.error}` : ''}
																</div>
															))}
														</>
													);
													return (
														<Tooltip content={tooltipContent}>
															<Tag
																minimal
																intent={
																	failed.length === 0
																		? 'success'
																		: failed.length <
																				results.length
																			? 'warning'
																			: 'danger'
																}
															>
																{failed.length === 0
																	? `${results.length} uploaded`
																	: `${failed.length}/${results.length} failed`}
															</Tag>
														</Tooltip>
													);
												})()}
											</td>
											<td>
												{hasFileWarnings ? (
													<Tooltip
														content={fileWarningContent ?? undefined}
													>
														<Tag minimal intent="warning">
															{itemSkipped.length +
																itemPartial.length}{' '}
															{itemSkipped.length +
																itemPartial.length ===
															1
																? 'pub'
																: 'pubs'}{' '}
															with issues
														</Tag>
													</Tooltip>
												) : exportItem.isProcessing || exportItem.error ? (
													'—'
												) : (
													<Tag minimal intent="success">
														OK
													</Tag>
												)}
											</td>
											<td style={{ textAlign: 'right' }}>
												{hasUrl && !isExpired && (
													<a
														className="bp3-button bp3-minimal bp3-small"
														href={downloadUrl!}
														aria-label="Download export"
													>
														Download
													</a>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</HTMLTable>
					</Collapse>
				</div>
			)}
		</div>
	);
};
