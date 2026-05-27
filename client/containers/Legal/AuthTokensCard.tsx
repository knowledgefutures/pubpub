import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
	Button,
	Callout,
	Card,
	Classes,
	Dialog,
	HTMLSelect,
	HTMLTable,
	InputGroup,
	Tag,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { ConfirmDialog } from 'components';

type AdminCommunityRef = {
	id: string;
	title: string;
	subdomain: string;
};

type ExistingToken = {
	id: string;
	userId: string;
	communityId: string;
	expiresAt: string | null;
	createdAt: string;
	community?: {
		id: string;
		title: string;
		subdomain: string;
	} | null;
};

type CreatedToken = {
	id: string;
	userId: string;
	communityId: string;
	token: string;
	expiresAt: string | null;
};

type ExpiresAtChoice = 'never' | '1d' | '1w' | '1m' | '3m' | '1y';

const expiresAtOptions: { value: ExpiresAtChoice; label: string }[] = [
	{ value: '1d', label: '1 day' },
	{ value: '1w', label: '1 week' },
	{ value: '1m', label: '1 month' },
	{ value: '3m', label: '3 months' },
	{ value: '1y', label: '1 year' },
	{ value: 'never', label: 'Never' },
];

type Props = {
	adminCommunities?: AdminCommunityRef[];
};

const formatDate = (iso: string | null | undefined) => {
	if (!iso) {
		return null;
	}
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date.toLocaleDateString();
};

const errorMessage = (e: unknown, fallback: string) => {
	if (e instanceof Error) {
		return e.message;
	}
	if (typeof e === 'object' && e !== null && 'message' in e) {
		return (e as { message: string }).message;
	}
	return fallback;
};

const AuthTokensCard = ({ adminCommunities = [] }: Props) => {
	const [tokens, setTokens] = useState<ExistingToken[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
	const [selectedExpiresAt, setSelectedExpiresAt] = useState<ExpiresAtChoice>('3m');
	const [isCreating, setIsCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);

	const [createdToken, setCreatedToken] = useState<CreatedToken | null>(null);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (adminCommunities.length > 0 && !selectedCommunityId) {
			setSelectedCommunityId(adminCommunities[0].id);
		}
	}, [adminCommunities, selectedCommunityId]);

	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		apiFetch
			.get('/api/authTokens')
			.then((result: ExistingToken[]) => {
				if (!cancelled) {
					setTokens(result);
					setLoadError(null);
				}
			})
			.catch((e) => {
				if (!cancelled) {
					setLoadError(errorMessage(e, 'Failed to load auth tokens.'));
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoading(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const communitiesById = useMemo(() => {
		const map = new Map<string, AdminCommunityRef>();
		adminCommunities.forEach((c) => map.set(c.id, c));
		return map;
	}, [adminCommunities]);

	const handleCreate = useCallback(async () => {
		if (!selectedCommunityId) {
			return;
		}
		setIsCreating(true);
		setCreateError(null);
		try {
			const created: CreatedToken = await apiFetch.post('/api/authTokens', {
				communityId: selectedCommunityId,
				expiresAt: selectedExpiresAt,
			});
			setCreatedToken(created);
			setCopied(false);
			const community = communitiesById.get(selectedCommunityId);
			setTokens((prev) => [
				{
					id: created.id,
					userId: created.userId,
					communityId: created.communityId,
					expiresAt: created.expiresAt,
					createdAt: new Date().toISOString(),
					community: community
						? {
								id: community.id,
								title: community.title,
								subdomain: community.subdomain,
							}
						: null,
				},
				...prev,
			]);
		} catch (e) {
			setCreateError(errorMessage(e, 'Failed to create auth token.'));
		} finally {
			setIsCreating(false);
		}
	}, [communitiesById, selectedCommunityId, selectedExpiresAt]);

	const handleRevoke = useCallback(async (tokenId: string) => {
		await apiFetch.delete(`/api/authTokens/${tokenId}`);
		setTokens((prev) => prev.filter((t) => t.id !== tokenId));
	}, []);

	const handleCopy = useCallback(() => {
		if (!createdToken) {
			return;
		}
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(createdToken.token).then(() => setCopied(true));
		}
	}, [createdToken]);

	const closeCreatedDialog = useCallback(() => {
		setCreatedToken(null);
		setCopied(false);
	}, []);

	const canMint = adminCommunities.length > 0;

	return (
		<Card>
			<h5>Auth tokens</h5>
			<p>
				Auth tokens let you authenticate against the PubPub API as yourself. Each token is
				scoped to one community where you are an admin and grants the same privileges as
				your account. A token automatically stops working if you are no longer an admin of
				that community.
			</p>

			{canMint ? (
				<div style={{ marginBottom: 16 }}>
					<div
						style={{
							display: 'flex',
							gap: 8,
							alignItems: 'center',
							flexWrap: 'wrap',
						}}
					>
						<HTMLSelect
							value={selectedCommunityId}
							onChange={(e) => setSelectedCommunityId(e.target.value)}
							disabled={isCreating}
							aria-label="Community"
						>
							{adminCommunities.map((c) => (
								<option key={c.id} value={c.id}>
									{c.title}
								</option>
							))}
						</HTMLSelect>
						<HTMLSelect
							value={selectedExpiresAt}
							onChange={(e) =>
								setSelectedExpiresAt(e.target.value as ExpiresAtChoice)
							}
							disabled={isCreating}
							aria-label="Expires after"
						>
							{expiresAtOptions.map((o) => (
								<option key={o.value} value={o.value}>
									Expires: {o.label}
								</option>
							))}
						</HTMLSelect>
						<Button
							intent="primary"
							loading={isCreating}
							disabled={!selectedCommunityId}
							onClick={handleCreate}
						>
							Generate token
						</Button>
					</div>
					{createError && (
						<Callout intent="danger" style={{ marginTop: 8 }}>
							{createError}
						</Callout>
					)}
				</div>
			) : (
				<Callout intent="primary" style={{ marginBottom: 16 }}>
					Only community admins can mint auth tokens.
				</Callout>
			)}

			{loadError && (
				<Callout intent="danger" style={{ marginBottom: 8 }}>
					{loadError}
				</Callout>
			)}

			{!isLoading && tokens.length === 0 && !loadError && (
				<p style={{ opacity: 0.7 }}>You have no auth tokens.</p>
			)}

			{tokens.length > 0 && (
				<HTMLTable condensed striped style={{ width: '100%' }}>
					<thead>
						<tr>
							<th>Community</th>
							<th>Created</th>
							<th>Expires</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{tokens.map((t) => {
							const expires = formatDate(t.expiresAt);
							const isExpired = !!(
								t.expiresAt && new Date(t.expiresAt).getTime() < Date.now()
							);
							return (
								<tr key={t.id}>
									<td>{t.community?.title ?? t.communityId}</td>
									<td>{formatDate(t.createdAt) ?? '—'}</td>
									<td>
										{expires ? (
											isExpired ? (
												<Tag minimal intent="warning">
													Expired
												</Tag>
											) : (
												expires
											)
										) : (
											'Never'
										)}
									</td>
									<td style={{ textAlign: 'right' }}>
										<ConfirmDialog
											title="Revoke auth token"
											text={
												<p>
													Revoking this token will immediately invalidate
													it. Any scripts or services using it will stop
													working.
												</p>
											}
											confirmLabel="Revoke"
											onConfirm={() => handleRevoke(t.id)}
										>
											{({ open }) => (
												<Button
													minimal
													small
													intent="danger"
													onClick={open}
												>
													Revoke
												</Button>
											)}
										</ConfirmDialog>
									</td>
								</tr>
							);
						})}
					</tbody>
				</HTMLTable>
			)}

			<Dialog
				isOpen={!!createdToken}
				title="Copy your new auth token"
				onClose={closeCreatedDialog}
				canEscapeKeyClose={false}
				canOutsideClickClose={false}
			>
				<div className={Classes.DIALOG_BODY}>
					<Callout intent="warning" style={{ marginBottom: 12 }}>
						This is the only time the token will be shown. Copy it now and store it
						somewhere safe.
					</Callout>
					{createdToken && (
						<InputGroup
							value={createdToken.token}
							readOnly
							onFocus={(e) => e.currentTarget.select()}
							rightElement={
								<Button
									minimal
									icon={copied ? 'tick' : 'clipboard'}
									onClick={handleCopy}
								>
									{copied ? 'Copied' : 'Copy'}
								</Button>
							}
						/>
					)}
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button intent="primary" onClick={closeCreatedDialog}>
							I’ve copied it
						</Button>
					</div>
				</div>
			</Dialog>
		</Card>
	);
};

export default AuthTokensCard;
