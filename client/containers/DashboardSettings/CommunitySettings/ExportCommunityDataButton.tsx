import React, { useCallback, useState } from 'react';

import { Button, Callout, HTMLTable, Icon, Spinner, Tag, Tooltip } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type PastExport = {
	id: string;
	createdAt: string;
	isProcessing: boolean;
	output: string | null;
	error: string | null;
};

type Props = {
	disabled?: boolean;
	pastExports?: PastExport[];
	isSuperAdmin?: boolean;
};

export const ExportCommunityDataButton = ({ disabled, pastExports, isSuperAdmin }: Props) => {
	const [isRequesting, setIsRequesting] = useState(false);
	const [requestedAt, setRequestedAt] = useState<Date | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const startExport = useCallback(async () => {
		setIsRequesting(true);
		setError(null);
		setMessage(null);

		try {
			const response = await apiFetch('/api/communities/export', {
				method: 'POST',
				body: JSON.stringify({}),
			});

			setRequestedAt(new Date());
			setMessage(
				response.message ??
					'Your data export is being generated. You will receive an email with a download link when it is ready.',
			);
		} catch (e) {
			const msg =
				e instanceof Error
					? e.message
					: typeof e === 'object' && e !== null && 'message' in e
						? (e as { message: string }).message
						: 'Something went wrong, please try again later.';
			setError(msg);
		} finally {
			setIsRequesting(false);
		}
	}, []);

	const hasInProgress = pastExports?.some((e) => e.isProcessing);
	const isButtonDisabled = isRequesting || !!requestedAt || hasInProgress || disabled;

	return (
		<div>
			<div>
				<Button disabled={isButtonDisabled} onClick={startExport}>
					{isRequesting ? (
						<>
							Generating...{' '}
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
						'Export in progress...'
					) : requestedAt ? (
						'Export started'
					) : (
						'Generate data export'
					)}
				</Button>
			</div>
			{message && (
				<Callout intent="success" style={{ marginTop: 12 }}>
					<p>{message}</p>
					{requestedAt && (
						<p style={{ fontSize: '0.9em', opacity: 0.7 }}>
							Requested at {requestedAt.toLocaleTimeString()}
						</p>
					)}
				</Callout>
			)}
			{error && (
				<Callout intent="danger" style={{ marginTop: 12 }}>
					<p>{error}</p>
				</Callout>
			)}
			{pastExports && pastExports.length > 0 && (
				<div style={{ marginTop: 16 }}>
					<h6>Exports in last 30 days</h6>
					<HTMLTable condensed striped style={{ width: '100%' }}>
						<thead>
							<tr>
								<th>Date</th>
								<th>Status</th>
								<th>Expires</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{pastExports.map((exportItem) => {
								const createdAt = new Date(exportItem.createdAt);
								const expiresAt = new Date(createdAt.getTime() + SEVEN_DAYS_MS);
								const isExpired = Date.now() > expiresAt.getTime();
								// The worker sometimes fails to write the final result back to
								// the database (intermittent connection issue) even though the
								// export itself succeeded and produced a download URL. When a URL
								// is present we treat the export as successful, regardless of any
								// error recorded alongside it.
								const hasUrl =
									!exportItem.isProcessing &&
									typeof exportItem.output === 'string' &&
									exportItem.output.length > 0;

								let status: React.ReactNode;
								if (exportItem.isProcessing) {
									status = (
										<Tag minimal intent="primary">
											Processing
										</Tag>
									);
								} else if (hasUrl) {
									status = (
										<span
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: 4,
											}}
										>
											<Tag minimal intent={isExpired ? 'warning' : 'success'}>
												{isExpired ? 'Expired' : 'Ready'}
											</Tag>
											{/* Surface the underlying error to super admins so the
											    intermittent worker failure stays visible, while
											    still presenting the export as successful. */}
											{isSuperAdmin && exportItem.error && (
												<Tooltip content={exportItem.error}>
													<Icon
														icon="info-sign"
														intent="warning"
														iconSize={12}
													/>
												</Tooltip>
											)}
										</span>
									);
								} else if (exportItem.error) {
									status = (
										<Tag minimal intent="danger" title={exportItem.error}>
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
											{hasUrl
												? isExpired
													? 'Expired'
													: expiresAt.toLocaleDateString()
												: '—'}
										</td>
										<td style={{ textAlign: 'right' }}>
											{hasUrl && !isExpired && (
												<a
													className="bp3-button bp3-minimal bp3-small"
													href={exportItem.output!}
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
				</div>
			)}
		</div>
	);
};
