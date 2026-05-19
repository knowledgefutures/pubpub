import React, { useCallback, useEffect, useState } from 'react';

import { Button, Callout, HTMLTable, Tag } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { ConfirmDialog, SettingsSection } from 'components';

type CommunityAuthToken = {
	id: string;
	userId: string;
	communityId: string;
	expiresAt: string | null;
	createdAt: string;
	user?: {
		id: string;
		fullName?: string | null;
		slug?: string | null;
		avatar?: string | null;
		initials?: string | null;
	} | null;
};

type Props = {
	communityData: {
		id: string;
		title: string;
	};
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

const CommunityAuthTokens = ({ communityData }: Props) => {
	const [tokens, setTokens] = useState<CommunityAuthToken[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		apiFetch
			.get(`/api/authTokens/community/${communityData.id}`)
			.then((result: CommunityAuthToken[]) => {
				if (!cancelled) {
					setTokens(result);
					setLoadError(null);
				}
			})
			.catch((e) => {
				if (!cancelled) {
					setLoadError(errorMessage(e, 'Failed to load community auth tokens.'));
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
	}, [communityData.id]);

	const handleRevoke = useCallback(
		async (tokenId: string) => {
			await apiFetch.delete(`/api/authTokens/community/${communityData.id}/${tokenId}`);
			setTokens((prev) => prev.filter((t) => t.id !== tokenId));
		},
		[communityData.id],
	);

	return (
		<SettingsSection title="Auth tokens">
			<p>
				Auth tokens grant the token’s owner programmatic access to this community with their
				full admin privileges. Demoting a user automatically invalidates their tokens;
				revoking a token here cuts off a single token without changing the user’s role.
			</p>

			{loadError && (
				<Callout intent="danger" style={{ marginBottom: 8 }}>
					{loadError}
				</Callout>
			)}

			{!isLoading && tokens.length === 0 && !loadError && (
				<p style={{ opacity: 0.7 }}>No auth tokens have been minted for this community.</p>
			)}

			{tokens.length > 0 && (
				<HTMLTable condensed striped style={{ width: '100%' }}>
					<thead>
						<tr>
							<th>Owner</th>
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
							const ownerName = t.user?.fullName || t.user?.slug || t.userId;
							return (
								<tr key={t.id}>
									<td>
										{t.user?.slug ? (
											<a href={`/user/${t.user.slug}`}>{ownerName}</a>
										) : (
											ownerName
										)}
									</td>
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
													it for {communityData.title}. The owner can mint
													a new one if they are still an admin.
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
		</SettingsSection>
	);
};

export default CommunityAuthTokens;
