import React, { useCallback, useEffect, useState } from 'react';

import { Button, Callout, Classes } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { SettingsSection } from 'components';

type KFAccount = {
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
		kfAccountId: string | null;
	};
};

const TransferOwnership = (props: Props) => {
	const { communityData } = props;
	const [accounts, setAccounts] = useState<KFAccount[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
	const [isTransferring, setIsTransferring] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const loadAccounts = useCallback(async () => {
		try {
			const data = await apiFetch.get('/api/kf/my-orgs');
			const fetchedAccounts: KFAccount[] = data.orgs ?? [];
			setAccounts(fetchedAccounts);
			// Default to the current account if set, otherwise the first one
			if (
				communityData.kfAccountId &&
				fetchedAccounts.some((a) => a.id === communityData.kfAccountId)
			) {
				setSelectedAccountId(communityData.kfAccountId);
			} else if (fetchedAccounts.length > 0) {
				setSelectedAccountId(fetchedAccounts[0].id);
			}
		} catch {
			setError('Failed to load accounts');
		} finally {
			setLoading(false);
		}
	}, [communityData.kfAccountId]);

	useEffect(() => {
		loadAccounts();
	}, [loadAccounts]);

	const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
	const isCurrentAccount = selectedAccountId === communityData.kfAccountId;

	const handleTransfer = async () => {
		if (!selectedAccountId || isCurrentAccount) return;
		setIsTransferring(true);
		setError(null);
		setSuccess(null);
		try {
			await apiFetch.post('/api/kf/transfer-community', {
				communityId: communityData.id,
				kfAccountId: selectedAccountId,
			});
			setSuccess(
				`Community transferred to ${selectedAccount?.name ?? 'the selected account'}.`,
			);
			// Update the local state so the button disables
			communityData.kfAccountId = selectedAccountId;
		} catch (err: any) {
			setError(err?.error || err?.message || 'Failed to transfer community');
		} finally {
			setIsTransferring(false);
		}
	};

	if (loading) {
		return (
			<SettingsSection title="Transfer Ownership">
				<p className={Classes.TEXT_MUTED}>Loading accounts...</p>
			</SettingsSection>
		);
	}

	// Need at least 2 accounts to have somewhere to transfer to
	if (accounts.length < 2) {
		return null;
	}

	const currentAccount = accounts.find((a) => a.id === communityData.kfAccountId);

	return (
		<SettingsSection title="Transfer Ownership">
			<p>
				Transfer this community to a different KF Account. The target account will become
				the billing owner of this community.
			</p>

			{currentAccount && (
				<p>
					Currently owned by: <strong>{currentAccount.name}</strong>
					{currentAccount.type === 'personal' ? ' (Personal)' : ''}
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
							value={selectedAccountId ?? ''}
							onChange={(e) => {
								setSelectedAccountId(e.target.value || null);
								setSuccess(null);
							}}
							disabled={isTransferring}
						>
							{accounts.map((account) => (
								<option key={account.id} value={account.id}>
									{account.name}
									{account.type === 'personal' ? ' (Personal)' : ''}
									{account.id === communityData.kfAccountId ? ' (current)' : ''}
								</option>
							))}
						</select>
					</div>
				</div>
				<Button
					intent="warning"
					text="Transfer"
					loading={isTransferring}
					disabled={isCurrentAccount || !selectedAccountId}
					onClick={handleTransfer}
				/>
			</div>
		</SettingsSection>
	);
};

export default TransferOwnership;
