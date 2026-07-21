import type { Community, UnderlayIntegration } from 'types';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Callout, Checkbox, Classes, HTMLSelect, Spinner } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { InputField, SettingsSection } from 'components';

type Props = {
	communityData: Community;
};

type ProbeAccount = { slug: string; name: string };
type ProbeCollection = { slug: string; name: string };

const SCHEDULE_OPTIONS = [
	{ value: '', label: 'Manual only' },
	{ value: '1', label: 'Every day' },
	{ value: '7', label: 'Every 7 days' },
	{ value: '30', label: 'Every 30 days' },
];

const formatElapsed = (seconds: number): string => {
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}m ${s}s`;
};

const UnderlaySettings = (_props: Props) => {
	const [config, setConfig] = useState<UnderlayIntegration | null>(null);
	const [apiKeyInput, setApiKeyInput] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [pushState, setPushState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
	const [error, setError] = useState<string | null>(null);
	const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
	const [testMessage, setTestMessage] = useState<string | null>(null);
	const [testDetails, setTestDetails] = useState<string[]>([]);
	const [elapsed, setElapsed] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const [org, setOrg] = useState('');
	const [collection, setCollection] = useState('');
	const [includeReleaseHtml, setIncludeReleaseHtml] = useState(true);
	const [includeAssets, setIncludeAssets] = useState(true);
	const [includePdfs, setIncludePdfs] = useState(false);
	const [scheduleDays, setScheduleDays] = useState('');

	const [accounts, setAccounts] = useState<ProbeAccount[]>([]);
	const [collections, setCollections] = useState<ProbeCollection[]>([]);
	const [probing, setProbing] = useState(false);
	const [probingCollections, setProbingCollections] = useState(false);
	const [probeError, setProbeError] = useState<string | null>(null);

	const stopTimer = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const startTimer = useCallback(() => {
		stopTimer();
		setElapsed(0);
		timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
	}, [stopTimer]);

	useEffect(() => stopTimer, [stopTimer]);

	const applyConfig = useCallback((next: UnderlayIntegration | null) => {
		setConfig(next);
		setOrg(next?.underlayOrg ?? '');
		setCollection(next?.underlayCollection ?? '');
		setIncludeReleaseHtml(next?.includeReleaseHtml ?? true);
		setIncludeAssets(next?.includeAssets ?? true);
		setIncludePdfs(next?.includePdfs ?? false);
		setScheduleDays(next?.scheduleDays ? String(next.scheduleDays) : '');
	}, []);

	useEffect(() => {
		apiFetch
			.get<UnderlayIntegration | null>('/api/underlayIntegration')
			.then((data) => applyConfig(data))
			.catch((e) => setError(e?.error ?? 'Failed to load settings'))
			.finally(() => setLoading(false));
	}, [applyConfig]);

	const hasKey = Boolean(apiKeyInput || config?.hasApiKey);

	const probeAccounts = useCallback(
		async (key?: string) => {
			if (!key && !config?.hasApiKey) {
				return;
			}
			setProbing(true);
			setProbeError(null);
			try {
				const body: Record<string, string> = {};
				if (key) {
					body.apiKey = key;
				}
				const result = await apiFetch.post<{
					ok: boolean;
					error?: string;
					accounts: ProbeAccount[];
					collections: ProbeCollection[];
				}>('/api/underlayIntegration/probe', body);
				if (!result.ok) {
					setProbeError(result.error ?? 'Failed to connect');
					setAccounts([]);
					return;
				}
				setAccounts(result.accounts);
			} catch (e: any) {
				setProbeError(e?.error ?? 'Failed to probe Underlay');
				setAccounts([]);
			} finally {
				setProbing(false);
			}
		},
		[config?.hasApiKey],
	);

	const probeCollections = useCallback(
		async (ownerSlug: string, key?: string) => {
			if (!ownerSlug || (!key && !config?.hasApiKey)) {
				setCollections([]);
				return;
			}
			setProbingCollections(true);
			try {
				const body: Record<string, string> = { underlayOrg: ownerSlug };
				if (key) {
					body.apiKey = key;
				}
				const result = await apiFetch.post<{
					ok: boolean;
					accounts: ProbeAccount[];
					collections: ProbeCollection[];
				}>('/api/underlayIntegration/probe', body);
				setCollections(result.ok ? result.collections : []);
			} catch {
				setCollections([]);
			} finally {
				setProbingCollections(false);
			}
		},
		[config?.hasApiKey],
	);

	// When the config loads and has a saved key, probe for accounts + collections.
	const initialProbeRef = useRef(false);
	useEffect(() => {
		if (!loading && config?.hasApiKey && !initialProbeRef.current) {
			initialProbeRef.current = true;
			probeAccounts().then(() => {
				if (config.underlayOrg) {
					probeCollections(config.underlayOrg);
				}
			});
		}
	}, [loading, config, probeAccounts, probeCollections]);

	const handleApiKeyBlur = () => {
		if (apiKeyInput) {
			probeAccounts(apiKeyInput);
		}
	};

	const handleOrgChange = (newOrg: string) => {
		setOrg(newOrg);
		setCollection('');
		setCollections([]);
		if (newOrg) {
			probeCollections(newOrg, apiKeyInput || undefined);
		}
	};

	const save = async () => {
		setSaving(true);
		setError(null);
		try {
			const body: Record<string, unknown> = {
				underlayOrg: org || null,
				underlayCollection: collection || null,
				includeReleaseHtml,
				includeAssets,
				includePdfs,
				scheduleDays: scheduleDays ? Number(scheduleDays) : null,
			};
			if (apiKeyInput) {
				body.apiKey = apiKeyInput;
			}
			const updated = await apiFetch.put<UnderlayIntegration>(
				'/api/underlayIntegration',
				body,
			);
			applyConfig(updated);
			setApiKeyInput('');
		} catch (e: any) {
			setError(e?.error ?? 'Failed to save settings');
		} finally {
			setSaving(false);
		}
	};

	const testConnection = async () => {
		setTestState('testing');
		setTestMessage(null);
		setTestDetails([]);
		setError(null);
		try {
			// Only send the key when the user typed a new one — the server falls back to the
			// saved (encrypted) key, so a saved integration tests without re-entering anything.
			const body: Record<string, string> = {};
			if (apiKeyInput) {
				body.apiKey = apiKeyInput;
			}
			if (org) {
				body.underlayOrg = org;
			}
			if (collection) {
				body.underlayCollection = collection;
			}
			const result = await apiFetch.post<{
				ok: boolean;
				message: string;
				details?: string[];
			}>('/api/underlayIntegration/test', body);
			setTestState(result.ok ? 'ok' : 'fail');
			setTestMessage(result.message);
			setTestDetails(result.details ?? []);
		} catch (e: any) {
			setTestState('fail');
			setTestMessage(e?.error ?? 'Test request failed');
		}
	};

	const pollTask = async (workerTaskId: string) => {
		let consecutiveErrors = 0;
		for (let i = 0; i < 240; i += 1) {
			// biome-ignore lint/performance/noAwaitInLoops: intentional 5s poll interval between status checks
			await new Promise((r) => setTimeout(r, 5000));
			try {
				const task = await apiFetch.get<{ isProcessing: boolean | null; error: unknown }>(
					`/api/workerTasks?workerTaskId=${workerTaskId}`,
				);
				consecutiveErrors = 0;
				if (!task.isProcessing) {
					stopTimer();
					const refreshed = await apiFetch.get<UnderlayIntegration | null>(
						'/api/underlayIntegration',
					);
					applyConfig(refreshed);
					if (task.error || refreshed?.lastPushStatus === 'error') {
						setPushState('error');
						const detail =
							refreshed?.lastPushError ??
							(typeof task.error === 'string' ? task.error : null) ??
							'Push failed';
						setError(detail);
					} else {
						setPushState('done');
					}
					return;
				}
			} catch {
				consecutiveErrors += 1;
				if (consecutiveErrors >= 5) {
					stopTimer();
					setPushState('error');
					setError('Lost connection while checking push status');
					return;
				}
			}
		}
		stopTimer();
		setPushState('error');
		setError('Push timed out — check back later');
	};

	const pushNow = async () => {
		setPushState('running');
		setError(null);
		startTimer();
		try {
			const { workerTaskId } = await apiFetch.post<{ workerTaskId: string }>(
				'/api/underlayIntegration/push',
				{},
			);
			await pollTask(workerTaskId);
		} catch (e: any) {
			stopTimer();
			setPushState('error');
			setError(e?.error ?? 'Failed to start push');
		}
	};

	if (loading) {
		return <SettingsSection title="Push to Underlay">Loading…</SettingsSection>;
	}

	const isConfigured = Boolean(org && collection && hasKey);
	const orgOptions = [
		{ value: '', label: 'Select organization…' },
		...accounts.map((a) => ({ value: a.slug, label: a.name })),
	];
	const collectionOptions = [
		{ value: '', label: 'Select collection…' },
		...collections.map((c) => ({ value: c.slug, label: c.name })),
	];
	const hasOrgOptions = accounts.length > 0;
	const hasCollectionOptions = collections.length > 0;

	return (
		<SettingsSection title="Push to Underlay">
			<p className={Classes.TEXT_MUTED}>
				Push this community&rsquo;s releases and metadata to an Underlay collection. Only
				new or changed content is transferred.
			</p>

			<InputField
				label={
					config?.hasApiKey
						? 'Underlay API key (enter a new one to replace)'
						: 'Underlay API key'
				}
				type="password"
				placeholder={config?.hasApiKey ? '••••••••' : 'ul_…'}
				value={apiKeyInput}
				onChange={(e) => setApiKeyInput(e.target.value)}
				onBlur={handleApiKeyBlur}
			/>

			{probeError && (
				<Callout intent="warning" style={{ marginBottom: 12 }}>
					{probeError}{' '}
					<Button
						small
						minimal
						icon="refresh"
						text="Retry"
						onClick={() => {
							probeAccounts(apiKeyInput || undefined).then(() => {
								if (org) {
									probeCollections(org, apiKeyInput || undefined);
								}
							});
						}}
					/>
				</Callout>
			)}

			<div className={Classes.FORM_GROUP}>
				<label className={Classes.LABEL} htmlFor="underlay-org">
					Organization
					{probing && (
						<span
							style={{
								display: 'inline-block',
								marginLeft: 8,
								verticalAlign: 'middle',
							}}
						>
							<Spinner size={12} />
						</span>
					)}
				</label>
				{hasOrgOptions ? (
					<HTMLSelect
						id="underlay-org"
						value={org}
						onChange={(e) => handleOrgChange(e.currentTarget.value)}
						options={orgOptions}
						fill
					/>
				) : (
					<input
						id="underlay-org"
						className={`${Classes.INPUT} ${Classes.FILL}`}
						placeholder="my-org"
						value={org}
						onChange={(e) => handleOrgChange(e.target.value)}
					/>
				)}
			</div>

			<div className={Classes.FORM_GROUP}>
				<label className={Classes.LABEL} htmlFor="underlay-collection">
					Collection
					{probingCollections && (
						<span
							style={{
								display: 'inline-block',
								marginLeft: 8,
								verticalAlign: 'middle',
							}}
						>
							<Spinner size={12} />
						</span>
					)}
				</label>
				{hasCollectionOptions ? (
					<HTMLSelect
						id="underlay-collection"
						value={collection}
						onChange={(e) => setCollection(e.currentTarget.value)}
						options={collectionOptions}
						fill
					/>
				) : (
					<input
						id="underlay-collection"
						className={`${Classes.INPUT} ${Classes.FILL}`}
						placeholder="my-collection"
						value={collection}
						onChange={(e) => setCollection(e.target.value)}
					/>
				)}
			</div>

			<Checkbox
				checked={includeReleaseHtml}
				label="Include rendered release content (HTML)"
				onChange={() => setIncludeReleaseHtml((v) => !v)}
			/>
			<Checkbox
				checked={includeAssets}
				label="Include in-content assets (images, files)"
				disabled={!includeReleaseHtml}
				onChange={() => setIncludeAssets((v) => !v)}
			/>
			<Checkbox
				checked={includePdfs}
				label="Include formatted PDF downloads"
				onChange={() => setIncludePdfs((v) => !v)}
			/>

			<div className={Classes.FORM_GROUP}>
				<label className={Classes.LABEL} htmlFor="underlay-schedule">
					Automatic push schedule
				</label>
				<HTMLSelect
					id="underlay-schedule"
					value={scheduleDays}
					onChange={(e) => setScheduleDays(e.currentTarget.value)}
					options={SCHEDULE_OPTIONS}
				/>
			</div>

			<div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
				<Button text="Save" intent="primary" loading={saving} onClick={save} />
				<Button
					text="Test connection"
					icon="link"
					loading={testState === 'testing'}
					disabled={!isConfigured || saving}
					onClick={testConnection}
				/>
				<Button
					text={
						pushState === 'running' ? `Pushing… ${formatElapsed(elapsed)}` : 'Push now'
					}
					loading={pushState === 'running'}
					disabled={!isConfigured || saving}
					onClick={pushNow}
				/>
			</div>

			{(testState === 'ok' || testState === 'fail') && testMessage && (
				<Callout
					intent={testState === 'ok' ? 'success' : 'danger'}
					style={{ marginTop: 12 }}
				>
					{testMessage}
					{testDetails.length > 0 && (
						<ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
							{testDetails.map((detail) => (
								<li key={detail}>{detail}</li>
							))}
						</ul>
					)}
				</Callout>
			)}
			{config?.lastPushedAt && (
				<p className={Classes.TEXT_MUTED} style={{ marginTop: 12 }}>
					Last push: {new Date(config.lastPushedAt).toLocaleString()}
					{config.lastPushSemver ? ` → ${config.lastPushSemver}` : ''} (
					{config.lastPushStatus ?? 'unknown'})
				</p>
			)}
			{config?.lastPushStatus === 'error' &&
				config.lastPushError &&
				pushState !== 'error' && (
					<Callout intent="warning" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
						Last push failed: {config.lastPushError}
					</Callout>
				)}
			{config?.lastPushStatus === 'success' && config.lastPushError && (
				<Callout intent="warning" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
					Last push succeeded with warnings: {config.lastPushError}
				</Callout>
			)}
			{pushState === 'done' && (
				<Callout intent="success" style={{ marginTop: 12 }}>
					Push complete.
				</Callout>
			)}
			{pushState === 'error' && error && (
				<Callout intent="danger" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
					{error}
				</Callout>
			)}
		</SettingsSection>
	);
};

export default UnderlaySettings;
