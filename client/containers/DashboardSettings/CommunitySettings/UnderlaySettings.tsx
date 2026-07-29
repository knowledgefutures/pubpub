import type { Community, UnderlayIntegration } from 'types';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
	Button,
	ButtonGroup,
	Callout,
	Checkbox,
	Classes,
	Collapse,
	HTMLSelect,
	Popover,
	Position,
	Spinner,
	Tag,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { InputField, SettingsSection, SuperAdminTag } from 'components';

type Props = {
	communityData: Community;
};

type ProbeAccount = { slug: string; name: string };
type ProbeCollection = { slug: string; name: string };

type PushWarning = { pubId?: string | null; assetUrl?: string | null; reason: string };
type PushStatus = 'running' | 'success' | 'error' | 'noop';
type PushLogView = {
	id: string;
	status: PushStatus;
	startedAt: string;
	finishedAt: string | null;
	semver: string | null;
	recordCount: number | null;
	fileCount: number | null;
	message: string | null;
	error: string | null;
	warnings: PushWarning[];
	workerTaskId: string | null;
};

/** GET /api/underlayIntegration adds current/last push state on top of the saved config. */
type UnderlayConfig = UnderlayIntegration & {
	readme?: string | null;
	currentPush?: PushLogView | null;
	lastPush?: PushLogView | null;
};

// Value is the number of days between automatic pushes; '' means manual only.
const SCHEDULE_OPTIONS = [
	{ value: '', label: 'Manual' },
	{ value: '1', label: 'Daily' },
	{ value: '7', label: 'Weekly' },
	{ value: '30', label: 'Monthly' },
];

// Downloadable export formats PubPub can generate; each is a content-addressed file on the Release.
const EXPORT_FORMAT_OPTIONS = [
	{ value: 'pdf', label: 'PDF' },
	{ value: 'epub', label: 'EPUB' },
	{ value: 'jats', label: 'JATS XML' },
	{ value: 'docx', label: 'Word (DOCX)' },
	{ value: 'tex', label: 'LaTeX' },
	{ value: 'markdown', label: 'Markdown' },
	{ value: 'html', label: 'HTML' },
	{ value: 'odt', label: 'OpenDocument (ODT)' },
	{ value: 'plain', label: 'Plain text' },
	{ value: 'json', label: 'JSON' },
];
const DEFAULT_EXPORT_FORMATS = ['pdf', 'epub'];
const sortedCsv = (arr: string[]) => [...arr].sort().join(',');

// Keep the credential/target inputs a readable width rather than stretching across the dashboard.
const FIELD_MAX_WIDTH = 520;

const POLL_INTERVAL_MS = 5000;

const formatElapsed = (seconds: number): string => {
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}m ${s}s`;
};

const statusIntent = (status: PushStatus): 'success' | 'danger' | 'primary' | 'none' => {
	switch (status) {
		case 'success':
			return 'success';
		case 'error':
			return 'danger';
		case 'running':
			return 'primary';
		default:
			return 'none';
	}
};

const statusLabel = (status: PushStatus): string => {
	switch (status) {
		case 'success':
			return 'Success';
		case 'error':
			return 'Failed';
		case 'running':
			return 'Running';
		default:
			return 'No changes';
	}
};

// Collapse a large warning list into "N× .ext — <reason with URL removed>" groups, so the
// push-history popover shows *why* assets were skipped at a glance (e.g. "218× .epub — …: 404")
// instead of hundreds of near-identical lines.
const summarizeWarnings = (
	warnings: PushWarning[],
): { key: string; count: number; sample?: string }[] => {
	const groups = new Map<string, { count: number; sample?: string }>();
	for (const w of warnings) {
		const ext = w.assetUrl?.split('?')[0].split('.').pop()?.toLowerCase();
		const extLabel = ext && ext.length <= 5 ? `.${ext}` : 'asset';
		const kind = (w.reason ?? 'skipped').replace(/https?:\/\/\S+/g, '<url>');
		const key = `${extLabel} — ${kind}`;
		const g = groups.get(key) ?? { count: 0, sample: w.assetUrl ?? undefined };
		g.count += 1;
		groups.set(key, g);
	}
	return [...groups.entries()]
		.map(([key, v]) => ({ key, count: v.count, sample: v.sample }))
		.sort((a, b) => b.count - a.count);
};

const UnderlaySettings = (_props: Props) => {
	const [config, setConfig] = useState<UnderlayConfig | null>(null);
	const [apiKeyInput, setApiKeyInput] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
	const [testMessage, setTestMessage] = useState<string | null>(null);
	const [testDetails, setTestDetails] = useState<string[]>([]);

	// Push status is tracked separately from the form fields so that polling (which refetches the
	// whole config) never clobbers the admin's unsaved edits.
	const [currentPush, setCurrentPush] = useState<PushLogView | null>(null);
	const [lastPush, setLastPush] = useState<PushLogView | null>(null);
	const [pushError, setPushError] = useState<string | null>(null);
	const [nowTs, setNowTs] = useState(() => Date.now());
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Form fields.
	const [org, setOrg] = useState('');
	const [collection, setCollection] = useState('');
	const [readme, setReadme] = useState('');
	const [includeReleaseHtml, setIncludeReleaseHtml] = useState(true);
	const [includeAssets, setIncludeAssets] = useState(true);
	const [exportFormats, setExportFormats] = useState<string[]>(DEFAULT_EXPORT_FORMATS);
	const [scheduleDays, setScheduleDays] = useState('');

	const [showReadme, setShowReadme] = useState(false);
	const [history, setHistory] = useState<PushLogView[] | null>(null);
	const [historyLoading, setHistoryLoading] = useState(false);

	const [accounts, setAccounts] = useState<ProbeAccount[]>([]);
	const [collections, setCollections] = useState<ProbeCollection[]>([]);
	const [probing, setProbing] = useState(false);
	const [probingCollections, setProbingCollections] = useState(false);
	const [probeError, setProbeError] = useState<string | null>(null);

	const stopPolling = useCallback(() => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	}, []);

	const loadHistory = useCallback(async () => {
		setHistoryLoading(true);
		try {
			const rows = await apiFetch.get<PushLogView[]>('/api/underlayIntegration/history');
			setHistory(rows);
		} catch {
			setHistory([]);
		} finally {
			setHistoryLoading(false);
		}
	}, []);

	// Poll the config endpoint while a push runs; stop as soon as it reaches a terminal state and
	// refresh the (always-visible) history so the completed push appears.
	const pollStatus = useCallback(async () => {
		try {
			const data = await apiFetch.get<UnderlayConfig | null>('/api/underlayIntegration');
			const running = data?.currentPush ?? null;
			setCurrentPush(running);
			setLastPush(data?.lastPush ?? null);
			if (!running || running.status !== 'running') {
				stopPolling();
				loadHistory();
			}
		} catch {
			// Transient error — keep polling; the interval will retry.
		}
	}, [stopPolling, loadHistory]);

	const startPolling = useCallback(() => {
		if (pollRef.current) {
			return;
		}
		pollRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
	}, [pollStatus]);

	const applyConfig = useCallback((next: UnderlayConfig | null) => {
		setConfig(next);
		setOrg(next?.underlayOrg ?? '');
		setCollection(next?.underlayCollection ?? '');
		setReadme(next?.readme ?? '');
		setIncludeReleaseHtml(next?.includeReleaseHtml ?? true);
		setIncludeAssets(next?.includeAssets ?? true);
		setExportFormats(next?.exportFormats ?? DEFAULT_EXPORT_FORMATS);
		setScheduleDays(next?.scheduleDays ? String(next.scheduleDays) : '');
		setCurrentPush(next?.currentPush ?? null);
		setLastPush(next?.lastPush ?? null);
	}, []);

	useEffect(() => {
		let cancelled = false;
		apiFetch
			.get<UnderlayConfig | null>('/api/underlayIntegration')
			.then((data) => {
				if (cancelled) {
					return;
				}
				applyConfig(data);
				// A push may already be running (e.g. after a reload) — reflect it and resume polling.
				if (data?.currentPush?.status === 'running') {
					startPolling();
				}
			})
			.catch((e) => setError(e?.error ?? 'Failed to load settings'))
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});
		// History is always visible now, so load it up front.
		loadHistory();
		return () => {
			cancelled = true;
		};
	}, [applyConfig, startPolling, loadHistory]);

	// Clean up the poll interval on unmount.
	useEffect(() => stopPolling, [stopPolling]);

	// Tick once a second only while a push is running, to show elapsed time.
	const isRunning = currentPush?.status === 'running';
	useEffect(() => {
		if (!isRunning) {
			if (tickRef.current) {
				clearInterval(tickRef.current);
				tickRef.current = null;
			}
			return undefined;
		}
		setNowTs(Date.now());
		tickRef.current = setInterval(() => setNowTs(Date.now()), 1000);
		return () => {
			if (tickRef.current) {
				clearInterval(tickRef.current);
				tickRef.current = null;
			}
		};
	}, [isRunning]);

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
				readme: readme || null,
				includeReleaseHtml,
				includeAssets,
				exportFormats,
				scheduleDays: scheduleDays ? Number(scheduleDays) : null,
			};
			if (apiKeyInput) {
				body.apiKey = apiKeyInput;
			}
			const updated = await apiFetch.put<UnderlayConfig>('/api/underlayIntegration', body);
			// PUT returns the saved config without the push-status fields — preserve those.
			applyConfig({ ...updated, currentPush, lastPush });
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

	const pushNow = async () => {
		setPushError(null);
		setError(null);
		// Optimistically show a running status immediately; polling refines it with the real log.
		setCurrentPush({
			id: 'pending',
			status: 'running',
			startedAt: new Date().toISOString(),
			finishedAt: null,
			semver: null,
			recordCount: null,
			fileCount: null,
			message: null,
			error: null,
			warnings: [],
			workerTaskId: null,
		});
		try {
			await apiFetch.post<{ workerTaskId?: string; message?: string }>(
				'/api/underlayIntegration/push',
				{},
			);
			// Whether we started a new push or attached to one already in progress, poll for status.
			startPolling();
			pollStatus();
		} catch (e: any) {
			setCurrentPush(null);
			setPushError(e?.error ?? 'Failed to start push');
		}
	};

	if (loading) {
		return (
			<SettingsSection
				id="push-to-underlay"
				title={
					<>
						Push to Underlay <SuperAdminTag />
					</>
				}
			>
				Loading…
			</SettingsSection>
		);
	}

	const isConfigured = Boolean(org && collection && hasKey);
	const isDirty =
		Boolean(apiKeyInput) ||
		org !== (config?.underlayOrg ?? '') ||
		collection !== (config?.underlayCollection ?? '') ||
		readme !== (config?.readme ?? '') ||
		includeReleaseHtml !== (config?.includeReleaseHtml ?? true) ||
		includeAssets !== (config?.includeAssets ?? true) ||
		sortedCsv(exportFormats) !== sortedCsv(config?.exportFormats ?? DEFAULT_EXPORT_FORMATS) ||
		scheduleDays !== (config?.scheduleDays ? String(config.scheduleDays) : '');

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

	const elapsedSeconds =
		isRunning && currentPush
			? Math.max(0, Math.floor((nowTs - Date.parse(currentPush.startedAt)) / 1000))
			: 0;

	const pushDisabledReason = !isConfigured
		? 'Enter an API key, organization, and collection first.'
		: isDirty
			? 'Save your changes before pushing.'
			: null;

	return (
		<SettingsSection
			id="push-to-underlay"
			title={
				<>
					Push to Underlay <SuperAdminTag />
				</>
			}
		>
			<p className={Classes.TEXT_MUTED}>
				Push this community&rsquo;s releases and metadata to an Underlay collection. Only
				new or changed content is transferred.
			</p>

			<div style={{ maxWidth: FIELD_MAX_WIDTH }}>
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
			</div>

			{probeError && (
				<Callout intent="warning" style={{ marginBottom: 12, maxWidth: FIELD_MAX_WIDTH }}>
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

			<div style={{ display: 'flex', gap: 16, maxWidth: FIELD_MAX_WIDTH }}>
				<div className={Classes.FORM_GROUP} style={{ flex: 1 }}>
					<label className={Classes.LABEL} htmlFor="underlay-org">
						Organization
						{probing && (
							<span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
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

				<div className={Classes.FORM_GROUP} style={{ flex: 1 }}>
					<label className={Classes.LABEL} htmlFor="underlay-collection">
						Collection
						{probingCollections && (
							<span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
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
			<div className={Classes.FORM_GROUP} style={{ marginTop: 8 }}>
				<div className={Classes.LABEL}>Downloadable exports</div>
				<Popover
					position={Position.BOTTOM_LEFT}
					content={
						<div style={{ padding: 12, maxWidth: FIELD_MAX_WIDTH }}>
							<p className={Classes.TEXT_MUTED} style={{ marginBottom: 8 }}>
								Push these downloadable export files (when PubPub has generated
								them) as content-addressed files on each release.
							</p>
							{EXPORT_FORMAT_OPTIONS.map((opt) => (
								<Checkbox
									key={opt.value}
									checked={exportFormats.includes(opt.value)}
									label={opt.label}
									onChange={() =>
										setExportFormats((prev) =>
											prev.includes(opt.value)
												? prev.filter((f) => f !== opt.value)
												: [...prev, opt.value],
										)
									}
								/>
							))}
						</div>
					}
				>
					<Button rightIcon="caret-down" alignText="left" style={{ minWidth: 220 }}>
						{exportFormats.length > 0
							? EXPORT_FORMAT_OPTIONS.filter((o) => exportFormats.includes(o.value))
									.map((o) => o.label)
									.join(', ')
							: 'No exports'}
					</Button>
				</Popover>
			</div>

			<div className={Classes.FORM_GROUP} style={{ marginTop: 8 }}>
				<div className={Classes.LABEL}>Automatic push schedule</div>
				<ButtonGroup>
					{SCHEDULE_OPTIONS.map((opt) => (
						<Button
							key={opt.value || 'manual'}
							text={opt.label}
							active={scheduleDays === opt.value}
							onClick={() => setScheduleDays(opt.value)}
						/>
					))}
				</ButtonGroup>
			</div>

			<div style={{ marginTop: 8, marginBottom: 12 }}>
				<Button
					minimal
					small
					alignText="left"
					icon={showReadme ? 'chevron-down' : 'chevron-right'}
					text="Collection README"
					onClick={() => setShowReadme((v) => !v)}
				/>
				<Collapse isOpen={showReadme}>
					<div style={{ paddingTop: 8, maxWidth: FIELD_MAX_WIDTH }}>
						<p className={Classes.TEXT_MUTED} style={{ marginBottom: 4 }}>
							Markdown shown as the collection&rsquo;s README/description on Underlay.
						</p>
						<textarea
							className={`${Classes.INPUT} ${Classes.FILL}`}
							style={{ minHeight: 140, fontFamily: 'monospace' }}
							placeholder="# About this collection&#10;&#10;Describe what this collection contains…"
							value={readme}
							onChange={(e) => setReadme(e.target.value)}
						/>
					</div>
				</Collapse>
			</div>

			<div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
				<Button text="Save" intent="primary" loading={saving} onClick={save} />
				<Button
					text="Test connection"
					icon="link"
					loading={testState === 'testing'}
					disabled={!isConfigured || saving}
					onClick={testConnection}
				/>
				<Button
					text="Push now"
					icon="cloud-upload"
					disabled={Boolean(pushDisabledReason) || saving || isRunning}
					onClick={pushNow}
				/>
				{pushDisabledReason && (
					<span className={Classes.TEXT_MUTED} style={{ fontSize: 12 }}>
						{pushDisabledReason}
					</span>
				)}
			</div>

			{(testState === 'ok' || testState === 'fail') && testMessage && (
				<Callout
					intent={testState === 'ok' ? 'success' : 'danger'}
					style={{ marginTop: 12, maxWidth: FIELD_MAX_WIDTH }}
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

			{pushError && (
				<Callout intent="danger" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
					{pushError}
				</Callout>
			)}

			{/* Live status only while a push runs. Completed pushes live in the history below. */}
			{isRunning && currentPush && (
				<Callout intent="primary" icon={null} style={{ marginTop: 12 }}>
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
						<Spinner size={16} />
						Push in progress… ({formatElapsed(elapsedSeconds)})
					</span>
					<div className={Classes.TEXT_MUTED} style={{ marginTop: 4, fontSize: 12 }}>
						This runs in the background — you can leave this page and come back.
					</div>
				</Callout>
			)}

			<div style={{ marginTop: 24 }}>
				<h5 className={Classes.HEADING}>
					Push history
					{historyLoading && (
						<span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
							<Spinner size={12} />
						</span>
					)}
				</h5>
				{history && history.length > 0 ? (
					<table
						className={`${Classes.HTML_TABLE} ${Classes.HTML_TABLE_CONDENSED}`}
						style={{ width: '100%' }}
					>
						<thead>
							<tr>
								<th>Status</th>
								<th>Version</th>
								<th>Records</th>
								<th>Files</th>
								<th>When</th>
								<th>Notes</th>
							</tr>
						</thead>
						<tbody>
							{history.map((entry) => (
								<tr key={entry.id}>
									<td>
										<Tag minimal intent={statusIntent(entry.status)}>
											{statusLabel(entry.status)}
										</Tag>
									</td>
									<td>{entry.semver ?? '—'}</td>
									<td>{entry.recordCount ?? '—'}</td>
									<td>{entry.fileCount ?? '—'}</td>
									<td>
										{new Date(
											entry.finishedAt ?? entry.startedAt,
										).toLocaleString()}
									</td>
									<td>
										{entry.status === 'error' ? (
											(entry.error ?? 'Failed')
										) : entry.warnings.length > 0 ? (
											<Popover
												position={Position.LEFT}
												content={
													<div
														style={{
															maxWidth: 520,
															maxHeight: 340,
															overflow: 'auto',
															padding: 12,
														}}
													>
														<div
															className={Classes.TEXT_MUTED}
															style={{ marginBottom: 8 }}
														>
															{entry.warnings.length} asset(s) skipped
															(non-fatal)
														</div>
														<ul
															style={{
																margin: 0,
																paddingLeft: 18,
																fontSize: 12,
															}}
														>
															{summarizeWarnings(entry.warnings).map(
																(g) => (
																	<li
																		key={g.key}
																		style={{
																			marginBottom: 6,
																			wordBreak: 'break-word',
																		}}
																	>
																		<strong>{g.count}×</strong>{' '}
																		{g.key}
																		{g.sample && (
																			<div
																				className={
																					Classes.TEXT_MUTED
																				}
																				style={{
																					wordBreak:
																						'break-all',
																				}}
																			>
																				{g.sample}
																			</div>
																		)}
																	</li>
																),
															)}
														</ul>
													</div>
												}
											>
												<Button
													minimal
													small
													intent="warning"
													rightIcon="caret-down"
												>
													{entry.warnings.length} skipped
												</Button>
											</Popover>
										) : (
											'—'
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<p className={Classes.TEXT_MUTED}>
						{historyLoading ? 'Loading…' : 'No pushes yet.'}
					</p>
				)}
			</div>

			{error && (
				<Callout intent="danger" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
					{error}
				</Callout>
			)}
		</SettingsSection>
	);
};

export default UnderlaySettings;
