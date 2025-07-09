import { Button, Callout } from '@blueprintjs/core';
import { apiFetch } from 'client/utils/apiFetch';
import { pingTask } from 'client/utils/pingTask';
import React, { useState } from 'react';

export const ExportCommunityDataButton = ({ disabled }: { disabled?: boolean }) => {
	const [isExporting, setIsExporting] = useState(false);
	const [exportUrl, setExportUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	return (
		<div>
			<div>
				<Button
					disabled={isExporting || disabled}
					onClick={() => {
						setExportUrl(null);
						setError(null);
						setIsExporting(true);
						apiFetch('/api/communities/archive', {
							method: 'POST',
							body: JSON.stringify({ dontWait: true }),
						})
							.then(({ workerTaskId, message }) => {
								if (message) {
									// message warning user that a task is already running
									setError(message);
								}
								return pingTask(workerTaskId, 1000);
							})
							.then((output) => {
								if (typeof output !== 'string') {
									console.error('Invalid output', output);
									setError('Invalid output');
									return;
								}

								setExportUrl(`${output}`);
								setIsExporting(false);
							})
							.catch((e) => {
								setIsExporting(false);
								setExportUrl(null);
								if (typeof e === 'string') {
									setError(e);
								} else {
									setError(
										'Somethig went wrong while exporting, please try again later.',
									);
								}
								console.error(e);
							});
					}}
				>
					{isExporting
						? 'Exporting... This may take up to 4 minutes'
						: 'Export Community Data'}
				</Button>
			</div>
			<br />

			{exportUrl && (
				<p>
					<a href={exportUrl} target="_blank" rel="noopener noreferrer">
						Download
					</a>
				</p>
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
