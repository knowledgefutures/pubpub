import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Callout, Collapse, HTMLSelect, HTMLTable, Spinner, Tag } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';

import './exportCollectionButton.scss';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

type PastExport = {
	id: string;
	createdAt: string;
	isProcessing: boolean;
	output: { downloadUrl: string; ftpUploaded: boolean; skippedPubs?: string[] } | null;
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
	const [warning, setWarning] = useState<string | null>(null);
	const [selectedFtpTargetId, setSelectedFtpTargetId] = useState<string>('');
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
	}, []);

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
						if (skipped.length > 0) {
							setWarning(
								`${skipped.length} pub${skipped.length === 1 ? ' was' : 's were'} skipped because no export files could be found: ${skipped.join(', ')}`,
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
			const body: Record<string, string> = { collectionId: activeCollection.id };
			if (selectedFtpTargetId) body.ftpTargetId = selectedFtpTargetId;
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
	}, [activeCollection, selectedFtpTargetId]);

	const hasInProgress = exports.some((e) => e.isProcessing);
	const isButtonDisabled = isRequesting || hasInProgress || !activeCollection;

	return (
		<div className="export-collection-button-component">
			<div className="export-controls">
				{ftpTargets.length > 0 && (
					<HTMLSelect
						value={selectedFtpTargetId}
						onChange={(e) => setSelectedFtpTargetId(e.target.value)}
					>
						<option value="">No FTP upload (download only)</option>
						{ftpTargets.map((t) => (
							<option key={t.id} value={t.id}>
								{t.host}
								{t.filePath ? ` (${t.filePath})` : ''}
							</option>
						))}
					</HTMLSelect>
				)}
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

									return (
										<tr key={exportItem.id}>
											<td>{createdAt.toLocaleString()}</td>
											<td>{status}</td>
											<td>
												{exportItem.output?.ftpUploaded ? (
													<Tag minimal intent="success">
														Uploaded
													</Tag>
												) : (
													'—'
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
