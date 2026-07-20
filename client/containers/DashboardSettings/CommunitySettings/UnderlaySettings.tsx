import type { Community, UnderlayIntegration } from 'types';

import React, { useEffect, useState } from 'react';

import { Button, Callout, Checkbox, Classes, HTMLSelect } from '@blueprintjs/core';

import { InputField, SettingsSection } from 'components';
import { apiFetch } from 'client/utils/apiFetch';

type Props = {
	communityData: Community;
};

const SCHEDULE_OPTIONS = [
	{ value: '', label: 'Manual only' },
	{ value: '1', label: 'Every day' },
	{ value: '7', label: 'Every 7 days' },
	{ value: '30', label: 'Every 30 days' },
];

const UnderlaySettings = (_props: Props) => {
	const [config, setConfig] = useState<UnderlayIntegration | null>(null);
	const [apiKeyInput, setApiKeyInput] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [pushState, setPushState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
	const [error, setError] = useState<string | null>(null);

	// Local editable copy of the fields.
	const [org, setOrg] = useState('');
	const [collection, setCollection] = useState('');
	const [includeReleaseHtml, setIncludeReleaseHtml] = useState(true);
	const [includeAssets, setIncludeAssets] = useState(true);
	const [includePdfs, setIncludePdfs] = useState(false);
	const [scheduleDays, setScheduleDays] = useState('');

	const applyConfig = (next: UnderlayIntegration | null) => {
		setConfig(next);
		setOrg(next?.underlayOrg ?? '');
		setCollection(next?.underlayCollection ?? '');
		setIncludeReleaseHtml(next?.includeReleaseHtml ?? true);
		setIncludeAssets(next?.includeAssets ?? true);
		setIncludePdfs(next?.includePdfs ?? false);
		setScheduleDays(next?.scheduleDays ? String(next.scheduleDays) : '');
	};

	useEffect(() => {
		apiFetch
			.get<UnderlayIntegration | null>('/api/underlayIntegration')
			.then((data) => applyConfig(data))
			.catch((e) => setError(e?.error ?? 'Failed to load settings'))
			.finally(() => setLoading(false));
	}, []);

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
			// Only send the API key when the admin typed a new one.
			if (apiKeyInput) {
				body.apiKey = apiKeyInput;
			}
			const updated = await apiFetch.put<UnderlayIntegration>('/api/underlayIntegration', body);
			applyConfig(updated);
			setApiKeyInput('');
		} catch (e: any) {
			setError(e?.error ?? 'Failed to save settings');
		} finally {
			setSaving(false);
		}
	};

	const pollTask = async (workerTaskId: string) => {
		for (let i = 0; i < 240; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await new Promise((r) => setTimeout(r, 5000));
			try {
				// eslint-disable-next-line no-await-in-loop
				const task = await apiFetch.get<{ isProcessing: boolean | null; error: unknown }>(
					`/api/workerTasks?workerTaskId=${workerTaskId}`,
				);
				if (!task.isProcessing) {
					if (task.error) {
						setPushState('error');
						setError(typeof task.error === 'string' ? task.error : 'Push failed');
					} else {
						setPushState('done');
						const refreshed = await apiFetch.get<UnderlayIntegration | null>(
							'/api/underlayIntegration',
						);
						applyConfig(refreshed);
					}
					return;
				}
			} catch {
				// keep polling
			}
		}
	};

	const pushNow = async () => {
		setPushState('running');
		setError(null);
		try {
			const { workerTaskId } = await apiFetch.post<{ workerTaskId: string }>(
				'/api/underlayIntegration/push',
				{},
			);
			await pollTask(workerTaskId);
		} catch (e: any) {
			setPushState('error');
			setError(e?.error ?? 'Failed to start push');
		}
	};

	if (loading) {
		return <SettingsSection title="Push to Underlay">Loading…</SettingsSection>;
	}

	const isConfigured = Boolean(org && collection && (config?.hasApiKey || apiKeyInput));

	return (
		<SettingsSection title="Push to Underlay">
			<p className={Classes.TEXT_MUTED}>
				Push this community&rsquo;s releases and metadata to an Underlay collection. Underlay
				stores content-addressed snapshots, so pushes with no changes are a no-op and only new
				or changed content is transferred.
			</p>

			<InputField
				label="Underlay organization"
				placeholder="my-org"
				value={org}
				onChange={(e) => setOrg(e.target.value)}
			/>
			<InputField
				label="Underlay collection"
				placeholder="my-collection"
				value={collection}
				onChange={(e) => setCollection(e.target.value)}
			/>
			<InputField
				label={config?.hasApiKey ? 'Underlay API key (set — enter a new one to replace)' : 'Underlay API key'}
				type="password"
				placeholder={config?.hasApiKey ? '••••••••' : 'ul_…'}
				value={apiKeyInput}
				onChange={(e) => setApiKeyInput(e.target.value)}
			/>

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
					text="Push now"
					loading={pushState === 'running'}
					disabled={!isConfigured || saving}
					onClick={pushNow}
				/>
			</div>

			{config?.lastPushedAt && (
				<p className={Classes.TEXT_MUTED} style={{ marginTop: 12 }}>
					Last push: {new Date(config.lastPushedAt).toLocaleString()}
					{config.lastPushSemver ? ` → ${config.lastPushSemver}` : ''} (
					{config.lastPushStatus ?? 'unknown'})
				</p>
			)}
			{pushState === 'done' && (
				<Callout intent="success" style={{ marginTop: 12 }}>
					Push complete.
				</Callout>
			)}
			{error && (
				<Callout intent="danger" style={{ marginTop: 12 }}>
					{error}
				</Callout>
			)}
		</SettingsSection>
	);
};

export default UnderlaySettings;
