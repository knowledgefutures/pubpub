import React, { useCallback, useEffect, useState } from 'react';

import { Button, Callout, Classes } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { SettingsSection } from 'components';

type KFOrg = {
	id: string;
	name: string;
	slug: string;
	type: 'personal' | 'shared';
	role: string;
};

type Props = {
	communityData: {
		id: string;
		title: string;
		kfOrgId: string | null;
	};
};

const TransferOwnership = (props: Props) => {
	const { communityData } = props;
	const [orgs, setOrgs] = useState<KFOrg[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
	const [isTransferring, setIsTransferring] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const loadOrgs = useCallback(async () => {
		try {
			const data = await apiFetch.get('/api/kf/my-orgs');
			const fetchedOrgs: KFOrg[] = data.orgs ?? [];
			setOrgs(fetchedOrgs);
			// Default to current org if set, otherwise first org
			if (communityData.kfOrgId && fetchedOrgs.some((o) => o.id === communityData.kfOrgId)) {
				setSelectedOrgId(communityData.kfOrgId);
			} else if (fetchedOrgs.length > 0) {
				setSelectedOrgId(fetchedOrgs[0].id);
			}
		} catch {
			setError('Failed to load organizations');
		} finally {
			setLoading(false);
		}
	}, [communityData.kfOrgId]);

	useEffect(() => {
		loadOrgs();
	}, [loadOrgs]);

	const selectedOrg = orgs.find((o) => o.id === selectedOrgId);
	const isCurrentOrg = selectedOrgId === communityData.kfOrgId;

	const handleTransfer = async () => {
		if (!selectedOrgId || isCurrentOrg) return;
		setIsTransferring(true);
		setError(null);
		setSuccess(null);
		try {
			await apiFetch.post('/api/kf/transfer-community', {
				communityId: communityData.id,
				kfOrgId: selectedOrgId,
			});
			setSuccess(
				`Community transferred to ${selectedOrg?.name ?? 'the selected organization'}.`,
			);
			// Update the local state so the button disables
			communityData.kfOrgId = selectedOrgId;
		} catch (err: any) {
			setError(err?.error || err?.message || 'Failed to transfer community');
		} finally {
			setIsTransferring(false);
		}
	};

	if (loading) {
		return (
			<SettingsSection title="Transfer Ownership">
				<p className={Classes.TEXT_MUTED}>Loading organizations...</p>
			</SettingsSection>
		);
	}

	// Need at least 2 orgs to have somewhere to transfer to
	if (orgs.length < 2) {
		return null;
	}

	const currentOrg = orgs.find((o) => o.id === communityData.kfOrgId);

	return (
		<SettingsSection title="Transfer Ownership">
			<p>
				Transfer this community to a different KF Account. The target account will become
				the billing owner of this community.
			</p>

			{currentOrg && (
				<p>
					Currently owned by: <strong>{currentOrg.name}</strong>
					{currentOrg.type === 'personal' ? ' (Personal)' : ''}
				</p>
			)}

			{error && (
				<Callout intent="danger" style={{ marginBottom: 10 }}>
					{error}
				</Callout>
			)}

			{success && (
				<Callout intent="success" style={{ marginBottom: 10 }}>
					{success}
				</Callout>
			)}

			<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
				<div style={{ flex: 1, maxWidth: 300 }}>
					<div className={Classes.HTML_SELECT} style={{ width: '100%' }}>
						<select
							value={selectedOrgId ?? ''}
							onChange={(e) => {
								setSelectedOrgId(e.target.value || null);
								setSuccess(null);
							}}
							disabled={isTransferring}
						>
							{orgs.map((org) => (
								<option key={org.id} value={org.id}>
									{org.name}
									{org.type === 'personal' ? ' (Personal)' : ''}
									{org.id === communityData.kfOrgId ? ' (current)' : ''}
								</option>
							))}
						</select>
					</div>
				</div>
				<Button
					intent="warning"
					text="Transfer"
					loading={isTransferring}
					disabled={isCurrentOrg || !selectedOrgId}
					onClick={handleTransfer}
				/>
			</div>
		</SettingsSection>
	);
};

export default TransferOwnership;
