import React, { useCallback, useEffect, useState } from 'react';

import { Button, Callout, Card, Spinner, Tag } from '@blueprintjs/core';
import SHA3 from 'crypto-js/sha3';

import { apiFetch } from 'client/utils/apiFetch';
import { InputField } from 'components';
import { communityUrl } from 'utils/canonicalUrls';

type DeletionAudit = {
	userId: string;
	fullName: string;
	email: string;
	pubAttributionCount: number;
	collectionAttributionCount: number;
	commentCount: number;
	soleAdminCommunities: { id: string; title: string; subdomain: string }[];
	soleManagerHubs: { id: string; title: string; slug: string }[];
};

const DeleteAccount = () => {
	const [audit, setAudit] = useState<DeletionAudit | null>(null);
	const [isLoadingAudit, setIsLoadingAudit] = useState(false);
	const [password, setPassword] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadAudit = useCallback(async () => {
		setIsLoadingAudit(true);
		try {
			const result = await apiFetch.get('/api/account/deletionAudit');
			setAudit(result);
		} catch (err: any) {
			setError(err?.message || 'Failed to load account deletion audit');
		} finally {
			setIsLoadingAudit(false);
		}
	}, []);

	useEffect(() => {
		loadAudit();
	}, [loadAudit]);

	const handleDelete = async () => {
		if (!password) return;
		setIsDeleting(true);
		setError(null);
		try {
			const hashedPassword = SHA3(password).toString();
			await apiFetch('/api/account', {
				method: 'DELETE',
				body: JSON.stringify({ password: hashedPassword }),
			});
			window.location.href = 'https://www.pubpub.org';
		} catch (err: any) {
			setError(err?.message || 'Failed to delete account');
			setIsDeleting(false);
		}
	};

	const canDelete =
		audit &&
		audit.soleAdminCommunities.length === 0 &&
		audit.soleManagerHubs.length === 0 &&
		password.length > 0;

	return (
		<Card>
			<h5>Delete account</h5>
			<Callout intent="danger" icon="warning-sign">
				<p>
					<b>Deleting your account is permanent and cannot be undone.</b>
				</p>
				{isLoadingAudit && <Spinner size={20} />}
				{audit && audit.soleAdminCommunities.length > 0 && (
					<Callout intent="warning" style={{ marginBottom: 15 }}>
						<p>
							You cannot delete your account because you are the only admin of{' '}
							<b>{audit.soleAdminCommunities.length}</b>{' '}
							{audit.soleAdminCommunities.length === 1 ? 'community' : 'communities'}:
						</p>
						<ul style={{ margin: '8px 0' }}>
							{audit.soleAdminCommunities.map((c) => (
								<li key={c.id}>
									<a
										href={communityUrl(c)}
										target="_blank"
										rel="noopener noreferrer"
									>
										<b>{c.title}</b>
									</a>
								</li>
							))}
						</ul>
						<p>
							Please add another admin to{' '}
							{audit.soleAdminCommunities.length === 1
								? 'this community'
								: 'these communities'}
							, or delete {audit.soleAdminCommunities.length === 1 ? 'it' : 'them'}{' '}
							first.
						</p>
					</Callout>
				)}
				{audit && audit.soleManagerHubs.length > 0 && (
					<Callout intent="warning" style={{ marginBottom: 15 }}>
						<p>
							You cannot delete your account because you are the only manager of{' '}
							<b>{audit.soleManagerHubs.length}</b>{' '}
							{audit.soleManagerHubs.length === 1 ? 'hub' : 'hubs'}:
						</p>
						<ul style={{ margin: '8px 0' }}>
							{audit.soleManagerHubs.map((h) => (
								<li key={h.id}>
									<a
										href={`/hub/${h.slug}/data`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<b>{h.title}</b>
									</a>
								</li>
							))}
						</ul>
						<p>
							Please add another manager to{' '}
							{audit.soleManagerHubs.length === 1 ? 'this hub' : 'these hubs'} first.
						</p>
					</Callout>
				)}
				{audit &&
					audit.soleAdminCommunities.length === 0 &&
					audit.soleManagerHubs.length === 0 && (
						<div style={{ marginBottom: 15 }}>
							<p>Here is what will happen when you delete your account:</p>
							<ul style={{ margin: '8px 0' }}>
								{audit.pubAttributionCount > 0 && (
									<li>
										<Tag minimal>{audit.pubAttributionCount}</Tag> pub
										attribution
										{audit.pubAttributionCount !== 1 ? 's' : ''} will be{' '}
										<b>preserved with your name</b> but unlinked from your
										account.
									</li>
								)}
								{audit.collectionAttributionCount > 0 && (
									<li>
										<Tag minimal>{audit.collectionAttributionCount}</Tag>{' '}
										collection attribution
										{audit.collectionAttributionCount !== 1 ? 's' : ''} will be{' '}
										<b>preserved with your name</b> but unlinked from your
										account.
									</li>
								)}
								{audit.commentCount > 0 && (
									<li>
										<Tag minimal>{audit.commentCount}</Tag> discussion comment
										{audit.commentCount !== 1 ? 's' : ''} will be{' '}
										<b>anonymized</b> (content preserved, shown as "Deleted
										User").
									</li>
								)}
							</ul>
							<p>
								We will delete all legally required information. As a platform with
								scholarly and academic preservation obligations, your name will be
								kept (unlinked from your account) where necessary to preserve the
								scholarly record.
							</p>
						</div>
					)}
				{audit &&
					audit.soleAdminCommunities.length === 0 &&
					audit.soleManagerHubs.length === 0 && (
						<>
							<p>Enter your password to confirm account deletion.</p>
							<InputField
								label={<b>Password</b>}
								type="password"
								value={password}
								onChange={(evt) => setPassword(evt.target.value)}
							/>
						</>
					)}
				{error && (
					<Callout intent="danger" style={{ marginBottom: 10 }}>
						{error}
					</Callout>
				)}
				<Button
					intent="danger"
					text="Permanently delete my account"
					loading={isDeleting}
					onClick={handleDelete}
					disabled={!canDelete}
				/>
			</Callout>
		</Card>
	);
};

export default DeleteAccount;
