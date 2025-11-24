import type { WorkerTask } from 'server/models';
import type { TaskResult } from 'workers/worker';

import React, { useCallback, useEffect, useState } from 'react';

import { AnchorButton, Button, Callout, ProgressBar } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { pingTask } from 'client/utils/pingTask';

type ProgressInfo = {
	totalUrls: number;
	processedUrls: number;
	percentage: number;
};

const PING_INTERVAL = 3_000;

export type ArchiveTask = WorkerTask & { output: TaskResult<'archive'>; type: 'archive' };

export const ExportCommunityDataButton = (props: {
	disabled?: boolean;
	lastExport?: ArchiveTask;
}) => {
	const [isExporting, setIsExporting] = useState(false);
	const [exportUrl, setExportUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState<ProgressInfo | 'starting' | null>(null);

	const hasActiveExport = props.lastExport && props.lastExport.isProcessing;

	const tryPingTask = useCallback(
		async (workerTaskId: string, initialCheck: boolean) => {
			try {
				const output = await pingTask(
					workerTaskId,
					PING_INTERVAL,
					PING_INTERVAL,
					undefined,
					(taskData) => {
						if (
							taskData.output &&
							typeof taskData.output === 'object' &&
							taskData.output.progress
						) {
							setProgress(taskData.output.progress);
						} else {
							setProgress('starting');
						}
					},
				);

				if (typeof output === 'string') {
					// we dont want to show "hey cool youre done exporting!" if we're just checking for an active export on mount
					if (initialCheck && !hasActiveExport) {
						// nothing to see here
						return;
					}
					setExportUrl(output);
					setIsExporting(false);
					setProgress(null);
					return;
				}

				if (
					typeof output === 'object' &&
					output &&
					'progress' in output &&
					(output as any).progress
				) {
					setProgress((output as any).progress);
					return;
				}

				console.error('Invalid output', output);
				setError('Invalid output');
			} catch (e) {
				setIsExporting(false);
				setExportUrl(null);
				setProgress(null);
				if (typeof e === 'string') {
					setError(e);
				} else {
					setError('Something went wrong while exporting, please try again later.');
				}
				console.error(e);
			}
		},
		[setError, setProgress, setIsExporting, setExportUrl],
	);

	const startExport = useCallback(async () => {
		setIsExporting(true);
		setError(null);
		setProgress(null);
		setExportUrl(null);

		try {
			const response = await apiFetch('/api/communities/archive', {
				method: 'POST',
				body: JSON.stringify({ dontWait: true }),
			});

			if (!response.workerTaskId) {
				setError('Something went wrong while exporting, please try again later.');
				setIsExporting(false);
				return;
			}

			if (response.message) {
				setError(response.message);
				setIsExporting(false);
				return;
			}

			await tryPingTask(response.workerTaskId, false);
		} catch (e) {
			setError('Something went wrong while exporting, please try again later.');
			console.error(e);
			setIsExporting(false);
		}
	}, [tryPingTask]);

	// check for existing archive task on mount
	useEffect(() => {
		if (hasActiveExport) {
			setIsExporting(true);
			tryPingTask(props.lastExport!.id, true);
		}
	}, [props.lastExport?.id, props.lastExport?.isProcessing, tryPingTask]);

	return (
		<div>
			<div>
				{exportUrl ? (
					<AnchorButton
						href={exportUrl}
						target="_blank"
						icon="download"
						title="Download Archive"
						text="Download Archive"
						aria-label="Download Archive"
						download
					/>
				) : (
					<Button disabled={isExporting || props.disabled} onClick={startExport}>
						{isExporting || hasActiveExport ? 'Exporting...' : 'Export Community Data'}
					</Button>
				)}
			</div>
			<br />

			{isExporting && (
				<div style={{ marginBottom: '16px' }}>
					{progress === 'starting' || !progress ? (
						<p style={{ marginBottom: '8px' }}>Starting export...</p>
					) : (
						<p style={{ marginBottom: '8px' }}>
							Processed {progress.processedUrls} of {progress.totalUrls} pages (
							{progress.percentage}%)
						</p>
					)}
					<ProgressBar
						value={progress === 'starting' || !progress ? 0 : progress.percentage / 100}
					/>
				</div>
			)}

			<br />
			{error && (
				<Callout intent="danger">
					<p>{error}</p>
				</Callout>
			)}
		</div>
	);
};
