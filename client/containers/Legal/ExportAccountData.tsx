import React, { useCallback, useState } from 'react';

import { Button, Callout, HTMLTable, Spinner, Tag } from '@blueprintjs/core';

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
	pastExports?: PastExport[];
};

const ExportAccountData = ({ pastExports }: Props) => {
	const [isRequesting, setIsRequesting] = useState(false);
	const [requestedAt, setRequestedAt] = useState<Date | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const startExport = useCallback(async () => {
		setIsRequesting(true);
		setError(null);
		setMessage(null);

		try {
			await apiFetch('/api/account/export', {
				method: 'POST',
				body: JSON.stringify({}),
			});

			setRequestedAt(new Date());
			setMessage(
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
	const isButtonDisabled = isRequesting || !!requestedAt || hasInProgress;

	return (
		<>
			<p>
				Download a copy of your account data in a machine-readable format. This includes
				your profile information, pub attributions, comments, reviews, and other activity on
				PubPub.
			</p>
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
								const hasUrl =
									!exportItem.isProcessing &&
									!exportItem.error &&
									typeof exportItem.output === 'string';

								let status: React.ReactNode;
								if (exportItem.isProcessing) {
									status = (
										<Tag minimal intent="primary">
											Processing
										</Tag>
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
											{!exportItem.isProcessing && !exportItem.error
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
		</>
	);
};

export default ExportAccountData;
