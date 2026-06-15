import React, { useCallback, useRef, useState } from 'react';

import { Button, Callout, FormGroup, InputGroup, Intent, Tag } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';

import './scamFiles.scss';

type StepState = 'idle' | 'loading' | 'success' | 'error';

type CdnStatus = {
	httpStatus: number;
	cfCacheStatus: string | null;
	fastlyCacheStatus: string | null;
	servedBy: string | null;
	age: string | null;
};

type AssociatedUser = {
	id: string;
	fullName: string;
	slug: string;
	email: string;
	spamStatus: string | null;
};

type AssociatedCommunity = {
	id: string;
	title: string;
	subdomain: string;
	spamStatus: string | null;
};

type CheckResult = {
	key: string;
	s3Assets: boolean;
	s3Scam: boolean;
	cdn: CdnStatus | null;
	associations: {
		users: AssociatedUser[];
		communities: AssociatedCommunity[];
	};
};

type LogEntry = {
	time: string;
	message: string;
};

type Props = {
	cachePurgeConfigured: boolean;
};

const parseKey = (rawUrl: string): string | null => {
	let url = rawUrl.trim();
	url = url.replace(/hxxps?/gi, 'https').replace(/\[.\]/g, '.');
	const match = url.match(/assets\.pubpub\.org\/(.+)/);
	return match?.[1] ?? null;
};

const spamStatusIntent = (status: string | null): Intent => {
	if (status === 'confirmed-spam') return Intent.DANGER;
	if (status === 'confirmed-not-spam') return Intent.SUCCESS;
	if (status === 'unreviewed') return Intent.WARNING;
	return Intent.NONE;
};

const spamStatusLabel = (status: string | null): string => {
	if (status === 'confirmed-spam') return 'Confirmed Spam';
	if (status === 'confirmed-not-spam') return 'Not Spam';
	if (status === 'unreviewed') return 'Unreviewed';
	return 'No spam tag';
};

const ScamFiles = (props: Props) => {
	const [url, setUrl] = useState('');
	const [parsedKey, setParsedKey] = useState<string | null>(null);
	const [copyState, setCopyState] = useState<StepState>('idle');
	const [deleteState, setDeleteState] = useState<StepState>('idle');
	const [fastlyState, setFastlyState] = useState<StepState>('idle');
	const [cloudflareState, setCloudflareState] = useState<StepState>('idle');
	const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
	const [checkLoading, setCheckLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [log, setLog] = useState<LogEntry[]>([]);
	const [spamLoading, setSpamLoading] = useState<string | null>(null);
	const logRef = useRef<LogEntry[]>([]);

	const addLog = useCallback((message: string) => {
		const entry = { time: new Date().toLocaleTimeString(), message };
		logRef.current = [...logRef.current, entry];
		setLog(logRef.current);
	}, []);

	const handleParse = useCallback(() => {
		setError(null);
		setCheckResult(null);
		setCopyState('idle');
		setDeleteState('idle');
		setFastlyState('idle');
		setCloudflareState('idle');
		const key = parseKey(url);
		if (!key) {
			setError(
				'Could not parse an asset key from the URL. Expected a URL containing assets.pubpub.org/...',
			);
			setParsedKey(null);
			return;
		}
		setParsedKey(key);
		addLog(`Parsed key: ${key}`);
	}, [url, addLog]);

	const handleCopy = useCallback(async () => {
		setCopyState('loading');
		setError(null);
		try {
			await apiFetch.post('/api/superadmin/scam-files/copy', { url });
			setCopyState('success');
			addLog(`Copied to reported-scams bucket`);
		} catch (err: any) {
			setCopyState('error');
			setError(err?.message || 'Failed to copy file');
			addLog(`Copy failed: ${err?.message}`);
		}
	}, [url, addLog]);

	const handleDelete = useCallback(async () => {
		setDeleteState('loading');
		setError(null);
		try {
			await apiFetch.post('/api/superadmin/scam-files/delete', { url });
			setDeleteState('success');
			addLog(`Deleted from assets.pubpub.org`);
		} catch (err: any) {
			setDeleteState('error');
			setError(err?.message || 'Failed to delete file');
			addLog(`Delete failed: ${err?.message}`);
		}
	}, [url, addLog]);

	const handlePurgeFastly = useCallback(async () => {
		setFastlyState('loading');
		setError(null);
		try {
			await apiFetch.post('/api/superadmin/scam-files/purge-fastly', { url });
			setFastlyState('success');
			addLog(`Fastly cache purged`);
		} catch (err: any) {
			setFastlyState('error');
			setError(err?.message || 'Failed to purge Fastly');
			addLog(`Fastly purge failed: ${err?.message}`);
		}
	}, [url, addLog]);

	const handlePurgeCloudflare = useCallback(async () => {
		setCloudflareState('loading');
		setError(null);
		try {
			await apiFetch.post('/api/superadmin/scam-files/purge-cloudflare', { url });
			setCloudflareState('success');
			addLog(`Cloudflare cache purged`);
		} catch (err: any) {
			setCloudflareState('error');
			setError(err?.message || 'Failed to purge Cloudflare');
			addLog(`Cloudflare purge failed: ${err?.message}`);
		}
	}, [url, addLog]);

	const handleCheck = useCallback(async () => {
		setCheckLoading(true);
		setError(null);
		try {
			const result = await apiFetch.post<CheckResult>('/api/superadmin/scam-files/check', {
				url,
			});
			setCheckResult(result);
			const assocCount =
				result.associations.users.length + result.associations.communities.length;
			addLog(
				`Status check complete — S3 assets: ${result.s3Assets ? 'FOUND' : 'not found'}, S3 scam: ${result.s3Scam ? 'FOUND' : 'not found'}, CDN HTTP: ${result.cdn?.httpStatus ?? 'N/A'}, associations: ${assocCount}`,
			);
		} catch (err: any) {
			setError(err?.message || 'Failed to check status');
			addLog(`Status check failed: ${err?.message}`);
		} finally {
			setCheckLoading(false);
		}
	}, [url, addLog]);

	const handleMarkUserSpam = useCallback(
		async (userId: string, status: string) => {
			setSpamLoading(userId);
			try {
				await apiFetch.put('/api/spamTags/user', { userId, status });
				addLog(`User ${userId} marked as ${status}`);
				setCheckResult((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						associations: {
							...prev.associations,
							users: prev.associations.users.map((u) =>
								u.id === userId ? { ...u, spamStatus: status } : u,
							),
						},
					};
				});
			} catch (err: any) {
				setError(err?.message || 'Failed to update spam status');
			} finally {
				setSpamLoading(null);
			}
		},
		[addLog],
	);

	const handleMarkCommunitySpam = useCallback(
		async (communityId: string, status: string) => {
			setSpamLoading(communityId);
			try {
				await apiFetch.put('/api/spamTags', { communityId, status });
				addLog(`Community ${communityId} marked as ${status}`);
				setCheckResult((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						associations: {
							...prev.associations,
							communities: prev.associations.communities.map((c) =>
								c.id === communityId ? { ...c, spamStatus: status } : c,
							),
						},
					};
				});
			} catch (err: any) {
				setError(err?.message || 'Failed to update spam status');
			} finally {
				setSpamLoading(null);
			}
		},
		[addLog],
	);

	const stepIntent = (state: StepState): Intent => {
		if (state === 'success') return Intent.SUCCESS;
		if (state === 'error') return Intent.DANGER;
		return Intent.NONE;
	};

	const stepLabel = (state: StepState): string => {
		if (state === 'success') return 'Done';
		if (state === 'error') return 'Failed';
		if (state === 'loading') return 'Working...';
		return 'Pending';
	};

	const hasAssociations =
		checkResult &&
		(checkResult.associations.users.length > 0 ||
			checkResult.associations.communities.length > 0);

	return (
		<div className="scam-files-component">
			<h2>Scam File Removal</h2>
			<p>
				Paste the reported scam URL directly from the email (defanged URLs like{' '}
				<code>hxxps://assets[.]pubpub[.]org/...</code> are supported).
			</p>

			{!props.cachePurgeConfigured && (
				<Callout intent={Intent.WARNING} style={{ marginBottom: 20 }}>
					Cloudflare cache purge is not configured. Set{' '}
					<code>CLOUDFLARE_CACHE_PURGE_API_TOKEN</code> and{' '}
					<code>CLOUDFLARE_ZONE_TAG</code> in environment variables.
				</Callout>
			)}

			{error && (
				<Callout intent={Intent.DANGER} style={{ marginBottom: 15 }}>
					{error}
				</Callout>
			)}

			<div className="url-input-form">
				<FormGroup label="Scam URL">
					<InputGroup
						placeholder="hxxps://assets.pubpub[.]org/gc76xhm9/instafollowers-31760624050613.html"
						value={url}
						onChange={(e) => {
							setUrl(e.target.value);
							setParsedKey(null);
							setCheckResult(null);
							setCopyState('idle');
							setDeleteState('idle');
							setFastlyState('idle');
							setCloudflareState('idle');
						}}
						onKeyDown={(e) => e.key === 'Enter' && handleParse()}
						large
					/>
				</FormGroup>
				<Button intent={Intent.PRIMARY} text="Parse" onClick={handleParse} large />
			</div>

			{parsedKey && (
				<>
					<div className="parsed-key">
						Key: <strong>{parsedKey}</strong>
					</div>

					<div className="steps-section">
						<h3>Removal Steps</h3>

						<div className="step">
							<span className="step-number">1</span>
							<span className="step-label">
								Copy to <code>reported-scams</code> bucket
							</span>
							<Tag intent={stepIntent(copyState)} minimal>
								{stepLabel(copyState)}
							</Tag>
							<Button
								small
								intent={Intent.PRIMARY}
								text="Copy"
								onClick={handleCopy}
								loading={copyState === 'loading'}
								disabled={copyState === 'loading'}
							/>
						</div>

						<div className="step">
							<span className="step-number">2</span>
							<span className="step-label">
								Delete from <code>assets.pubpub.org</code>
							</span>
							<Tag intent={stepIntent(deleteState)} minimal>
								{stepLabel(deleteState)}
							</Tag>
							<Button
								small
								intent={Intent.DANGER}
								text="Delete"
								onClick={handleDelete}
								loading={deleteState === 'loading'}
								disabled={deleteState === 'loading' || copyState !== 'success'}
							/>
						</div>

						<div className="step">
							<span className="step-number">3</span>
							<span className="step-label">Purge Fastly cache</span>
							<Tag intent={stepIntent(fastlyState)} minimal>
								{stepLabel(fastlyState)}
							</Tag>
							<Button
								small
								intent={Intent.WARNING}
								text="Purge Fastly"
								onClick={handlePurgeFastly}
								loading={fastlyState === 'loading'}
								disabled={fastlyState === 'loading' || deleteState !== 'success'}
							/>
						</div>

						<div className="step">
							<span className="step-number">4</span>
							<span className="step-label">
								Purge Cloudflare cache{' '}
								<em>(verify Fastly first with Check Status below)</em>
							</span>
							<Tag intent={stepIntent(cloudflareState)} minimal>
								{stepLabel(cloudflareState)}
							</Tag>
							<Button
								small
								intent={Intent.WARNING}
								text="Purge Cloudflare"
								onClick={handlePurgeCloudflare}
								loading={cloudflareState === 'loading'}
								disabled={
									cloudflareState === 'loading' ||
									fastlyState !== 'success' ||
									!props.cachePurgeConfigured
								}
							/>
						</div>
					</div>

					<div className="status-section">
						<h3>Check Status</h3>
						<p>
							Checks S3, CDN cache headers, and searches for associated
							users/communities.
						</p>
						<Button
							intent={Intent.PRIMARY}
							text="Check Status"
							onClick={handleCheck}
							loading={checkLoading}
							icon="search"
						/>

						{checkResult && (
							<>
								<div className="status-grid">
									<span className="status-label">S3 (assets.pubpub.org)</span>
									<span
										className={`status-value ${checkResult.s3Assets ? 'status-found' : 'status-not-found'}`}
									>
										{checkResult.s3Assets
											? 'FOUND (still exists!)'
											: 'Not found (deleted)'}
									</span>

									<span className="status-label">S3 (reported-scams)</span>
									<span
										className={`status-value ${checkResult.s3Scam ? 'status-not-found' : 'status-found'}`}
									>
										{checkResult.s3Scam ? 'FOUND (backed up)' : 'Not found'}
									</span>

									<span className="status-label">CDN HTTP Status</span>
									<span className="status-value">
										{checkResult.cdn?.httpStatus ?? 'Could not reach'}
									</span>

									<span className="status-label">Cloudflare Cache</span>
									<span
										className={`status-value ${checkResult.cdn?.cfCacheStatus === 'HIT' ? 'status-found' : 'status-not-found'}`}
									>
										{checkResult.cdn?.cfCacheStatus ?? 'N/A'}
									</span>

									<span className="status-label">Fastly Cache</span>
									<span
										className={`status-value ${checkResult.cdn?.fastlyCacheStatus?.includes('HIT') ? 'status-found' : 'status-not-found'}`}
									>
										{checkResult.cdn?.fastlyCacheStatus ?? 'N/A'}
									</span>

									<span className="status-label">Served By</span>
									<span className="status-value">
										{checkResult.cdn?.servedBy ?? 'N/A'}
									</span>

									<span className="status-label">Cache Age</span>
									<span className="status-value">
										{checkResult.cdn?.age ? `${checkResult.cdn.age}s` : 'N/A'}
									</span>
								</div>

								{hasAssociations && (
									<div className="associations-section">
										<h4>Associated Accounts</h4>

										{checkResult.associations.users.map((user) => (
											<div className="association-row" key={user.id}>
												<div className="association-info">
													<strong>{user.fullName}</strong>
													<span className="association-detail">
														{user.email} &middot;{' '}
														<a
															href={`/superadmin/spamUsers?q=${encodeURIComponent(user.email)}`}
														>
															{user.slug}
														</a>
													</span>
												</div>
												<Tag
													intent={spamStatusIntent(user.spamStatus)}
													minimal
												>
													{spamStatusLabel(user.spamStatus)}
												</Tag>
												{user.spamStatus !== 'confirmed-spam' && (
													<Button
														small
														intent={Intent.DANGER}
														text="Mark Spam"
														loading={spamLoading === user.id}
														onClick={() =>
															handleMarkUserSpam(
																user.id,
																'confirmed-spam',
															)
														}
													/>
												)}
												{user.spamStatus === 'confirmed-spam' && (
													<Button
														small
														intent={Intent.SUCCESS}
														text="Mark Not Spam"
														loading={spamLoading === user.id}
														onClick={() =>
															handleMarkUserSpam(
																user.id,
																'confirmed-not-spam',
															)
														}
													/>
												)}
											</div>
										))}

										{checkResult.associations.communities.map((community) => (
											<div className="association-row" key={community.id}>
												<div className="association-info">
													<strong>{community.title}</strong>
													<span className="association-detail">
														<a
															href={`https://${community.subdomain}.pubpub.org`}
															target="_blank"
															rel="noopener noreferrer"
														>
															{community.subdomain}.pubpub.org
														</a>{' '}
														&middot;{' '}
														<a
															href={`/superadmin/spam?q=${encodeURIComponent(community.subdomain)}`}
														>
															View in Spam tab
														</a>
													</span>
												</div>
												<Tag
													intent={spamStatusIntent(community.spamStatus)}
													minimal
												>
													{spamStatusLabel(community.spamStatus)}
												</Tag>
												{community.spamStatus !== 'confirmed-spam' && (
													<Button
														small
														intent={Intent.DANGER}
														text="Mark Spam"
														loading={spamLoading === community.id}
														onClick={() =>
															handleMarkCommunitySpam(
																community.id,
																'confirmed-spam',
															)
														}
													/>
												)}
												{community.spamStatus === 'confirmed-spam' && (
													<Button
														small
														intent={Intent.SUCCESS}
														text="Mark Not Spam"
														loading={spamLoading === community.id}
														onClick={() =>
															handleMarkCommunitySpam(
																community.id,
																'confirmed-not-spam',
															)
														}
													/>
												)}
											</div>
										))}
									</div>
								)}

								{!hasAssociations && (
									<Callout
										intent={Intent.NONE}
										icon="info-sign"
										style={{ marginTop: 12 }}
									>
										No associated users or communities found for this asset key.
									</Callout>
								)}
							</>
						)}
					</div>

					{log.length > 0 && (
						<div className="history-section">
							<h4>Activity Log</h4>
							{log.map((entry) => (
								<div
									className="history-entry"
									key={`${entry.time}-${entry.message}`}
								>
									<span className="history-time">{entry.time}</span>
									{entry.message}
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default ScamFiles;
