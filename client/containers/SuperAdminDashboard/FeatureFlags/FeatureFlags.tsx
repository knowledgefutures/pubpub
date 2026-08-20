import type { FlagSummary } from './types';

import React, { useCallback, useMemo, useState } from 'react';

import {
	Button,
	Callout,
	Classes,
	Dialog,
	InputGroup,
	Intent,
	NonIdealState,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';

import FeatureFlagCard from './FeatureFlagCard';

import './featureFlags.scss';

type Props = {
	featureFlags: FlagSummary[];
	totalCommunities: number;
	totalUsers: number;
};

const FeatureFlags = (props: Props) => {
	const [flags, setFlags] = useState<FlagSummary[]>(props.featureFlags);
	const [newFlagName, setNewFlagName] = useState('');
	const [filterText, setFilterText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<FlagSummary | null>(null);

	const filteredFlags = useMemo(() => {
		const q = filterText.toLowerCase().trim();
		if (!q) return flags;
		return flags.filter((flag) => flag.name.toLowerCase().includes(q));
	}, [flags, filterText]);

	const handleCreate = useCallback(async () => {
		const name = newFlagName.trim();
		if (!name) {
			setError('Flag name is required.');
			return;
		}
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const result = await apiFetch.post<FlagSummary>('/api/superadmin/feature-flags', {
				name,
			});
			setFlags((prev) =>
				[...prev, result].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
			);
			setNewFlagName('');
			setSuccess(
				`Feature flag "${result.name}" created. It is off for everyone until you roll it out or add overrides.`,
			);
		} catch (err: any) {
			setError(err?.message || 'Failed to create feature flag.');
		} finally {
			setIsLoading(false);
		}
	}, [newFlagName]);

	const handleDelete = useCallback(async (flag: FlagSummary) => {
		setPendingDelete(null);
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			await apiFetch.delete(`/api/superadmin/feature-flags/${flag.id}`);
			setFlags((prev) => prev.filter((f) => f.id !== flag.id));
			setSuccess(`Feature flag "${flag.name}" and all of its overrides were deleted.`);
		} catch (err: any) {
			setError(err?.message || 'Failed to delete feature flag.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleFlagChange = useCallback((updated: FlagSummary) => {
		setFlags((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
	}, []);

	const totalOverrideCount = (flag: FlagSummary) =>
		flag.overrides.communitiesOn +
		flag.overrides.communitiesOff +
		flag.overrides.usersOn +
		flag.overrides.usersOff;

	return (
		<div className="feature-flags-component">
			<h2>Feature Flags</h2>
			<p className="intro">
				Feature flags selectively enable features for certain communities or users. A flag
				can be forced on or off per community or user, or rolled out gradually to a fraction
				of all of them. Forced overrides always win over the gradual rollout;
				&ldquo;off&rdquo; overrides win over &ldquo;on&rdquo; overrides. Flags are read in
				code via <code>initialData.featureFlags</code> — see{' '}
				<code>server/featureFlag/README.md</code>.
			</p>

			{error && (
				<Callout intent={Intent.DANGER} style={{ marginBottom: 15 }}>
					{error}
				</Callout>
			)}
			{success && (
				<Callout intent={Intent.SUCCESS} style={{ marginBottom: 15 }}>
					{success}
				</Callout>
			)}

			<h4>Create a flag</h4>
			<div className="create-flag-form">
				<InputGroup
					placeholder="e.g. newActivityDash"
					value={newFlagName}
					onChange={(e) => setNewFlagName(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
					disabled={isLoading}
				/>
				<Button
					intent={Intent.PRIMARY}
					text="Create flag"
					onClick={handleCreate}
					loading={isLoading}
				/>
			</div>

			<h4>Manage flags</h4>
			{flags.length === 0 ? (
				<NonIdealState
					icon="flag"
					title="No feature flags"
					description="Create a feature flag above to get started."
				/>
			) : (
				<>
					<div className="filter-bar">
						<InputGroup
							leftIcon="search"
							placeholder="Filter flags by name…"
							value={filterText}
							onChange={(e) => setFilterText(e.target.value)}
						/>
						<span className="flag-count">
							{filterText && filteredFlags.length !== flags.length
								? `Showing ${filteredFlags.length} of ${flags.length}`
								: `Total: ${flags.length}`}{' '}
							flag{flags.length !== 1 ? 's' : ''}
						</span>
					</div>
					<div className="flag-list">
						{filteredFlags.map((flag) => (
							<FeatureFlagCard
								key={flag.id}
								flag={flag}
								totalCommunities={props.totalCommunities}
								totalUsers={props.totalUsers}
								onChange={handleFlagChange}
								onRequestDelete={setPendingDelete}
							/>
						))}
					</div>
				</>
			)}

			<Dialog
				isOpen={!!pendingDelete}
				onClose={() => setPendingDelete(null)}
				title="Delete Feature Flag"
				icon="warning-sign"
			>
				<div className={Classes.DIALOG_BODY}>
					<p>
						Delete feature flag <strong>{pendingDelete?.name}</strong>?
					</p>
					{pendingDelete && totalOverrideCount(pendingDelete) > 0 && (
						<p>
							This will also remove its {totalOverrideCount(pendingDelete)} community
							and user override
							{totalOverrideCount(pendingDelete) !== 1 ? 's' : ''}.
						</p>
					)}
					<p>
						Any code checking this flag will see it as <code>false</code> afterwards.
					</p>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setPendingDelete(null)}>Cancel</Button>
						<Button
							intent={Intent.DANGER}
							onClick={() => pendingDelete && handleDelete(pendingDelete)}
							loading={isLoading}
						>
							Delete
						</Button>
					</div>
				</div>
			</Dialog>
		</div>
	);
};

export default FeatureFlags;
