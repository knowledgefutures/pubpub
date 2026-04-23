import React, { useCallback, useMemo, useState } from 'react';

import {
	Button,
	Callout,
	Classes,
	Dialog,
	FormGroup,
	InputGroup,
	Intent,
	NonIdealState,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';

import './customDomains.scss';

const CNAME_TARGET = 'custom-domain-1.pubpub.org';

type CommunityDomain = {
	id: string;
	subdomain: string;
	domain: string;
	title: string;
};

type Props = {
	communities: CommunityDomain[];
	cloudflareConfigured: boolean;
};

const CustomDomains = (props: Props) => {
	const [communities, setCommunities] = useState<CommunityDomain[]>(props.communities);
	const [communityIdentifier, setCommunityIdentifier] = useState('');
	const [newDomain, setNewDomain] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [pendingRemove, setPendingRemove] = useState<CommunityDomain | null>(null);
	const [filterText, setFilterText] = useState('');

	const filteredCommunities = useMemo(() => {
		const q = filterText.toLowerCase().trim();
		if (!q) return communities;
		return communities.filter(
			(c) =>
				c.domain.toLowerCase().includes(q) ||
				c.title.toLowerCase().includes(q) ||
				c.subdomain.toLowerCase().includes(q),
		);
	}, [communities, filterText]);

	const cnameMessage = `Please point your domain's CNAME record to:\n\n${CNAME_TARGET}\n\nThis should be set up with your DNS provider. The CNAME record for your custom domain should point to ${CNAME_TARGET}. Once the DNS change propagates (usually within a few minutes to a few hours), your custom domain will be active.`;

	const handleCopyCname = useCallback(() => {
		navigator.clipboard.writeText(cnameMessage);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [cnameMessage]);

	const handleAdd = useCallback(async () => {
		if (!communityIdentifier.trim() || !newDomain.trim()) {
			setError('Both community ID/subdomain and domain are required.');
			return;
		}
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const result = await apiFetch.post<CommunityDomain>('/api/superadmin/custom-domains', {
				communityId: communityIdentifier.trim(),
				domain: newDomain.trim(),
			});
			setCommunities((prev) => {
				const filtered = prev.filter((c) => c.id !== result.id);
				return [...filtered, result].sort((a, b) => a.domain.localeCompare(b.domain));
			});
			setCommunityIdentifier('');
			setNewDomain('');
			setSuccess(`Custom domain "${result.domain}" added for "${result.title}".`);
		} catch (err: any) {
			setError(err?.message || 'Failed to add custom domain.');
		} finally {
			setIsLoading(false);
		}
	}, [communityIdentifier, newDomain]);

	const handleRemove = useCallback(async (community: CommunityDomain) => {
		setPendingRemove(null);
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			await apiFetch.delete('/api/superadmin/custom-domains', { communityId: community.id });
			setCommunities((prev) => prev.filter((c) => c.id !== community.id));
			setSuccess(`Custom domain "${community.domain}" removed from "${community.title}".`);
		} catch (err: any) {
			setError(err?.message || 'Failed to remove custom domain.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	return (
		<div className="custom-domains-component">
			<h2>Custom Domains</h2>

			{!props.cloudflareConfigured && (
				<Callout intent={Intent.WARNING} style={{ marginBottom: 20 }}>
					Cloudflare custom hostname API is not configured. Set{' '}
					<code>CLOUDFLARE_CUSTOM_HOSTNAME_API_TOKEN</code> and{' '}
					<code>CLOUDFLARE_ZONE_TAG</code> environment variables. Domains can still be
					viewed but add/remove will fail.
				</Callout>
			)}

			<h4>User Instructions</h4>
			<button type="button" className="cname-notice" onClick={handleCopyCname}>
				<p>
					Please point your domain's CNAME record to: <code>{CNAME_TARGET}</code>
				</p>
				<p>
					This should be set up with your DNS provider. The CNAME record for your custom
					domain should point to <code>{CNAME_TARGET}</code>. Once the DNS change
					propagates (usually within a few minutes to a few hours), your custom domain
					will be active.
				</p>
				<span className="copy-hint">
					{copied ? '✓ Copied to clipboard' : 'Click to copy'}
				</span>
			</button>

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

			<h4>Add Domain</h4>
			<div className="add-domain-form">
				<FormGroup label="Community ID or Subdomain" style={{ flex: 1 }}>
					<InputGroup
						placeholder="e.g. abc123-uuid or my-community"
						value={communityIdentifier}
						onChange={(e) => setCommunityIdentifier(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="Custom Domain" style={{ flex: 1 }}>
					<InputGroup
						placeholder="e.g. journal.example.com"
						value={newDomain}
						onChange={(e) => setNewDomain(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<Button
					intent={Intent.PRIMARY}
					text="Add Domain"
					onClick={handleAdd}
					loading={isLoading}
					style={{ marginBottom: 1 }}
				/>
			</div>

			<h4>Manage Domains</h4>
			{communities.length === 0 ? (
				<NonIdealState
					icon="globe-network"
					title="No Custom Domains"
					description="No communities currently have a custom domain configured."
				/>
			) : (
				<>
					<div className="filter-bar">
						<InputGroup
							leftIcon="search"
							placeholder="Filter by domain, title, or subdomain…"
							value={filterText}
							onChange={(e) => setFilterText(e.target.value)}
						/>
						<span className="domain-count">
							{filterText && filteredCommunities.length !== communities.length
								? `Showing ${filteredCommunities.length} of ${communities.length}`
								: `Total: ${communities.length}`}{' '}
							custom domain{communities.length !== 1 ? 's' : ''}
						</span>
					</div>
					<table className="domains-table">
						<thead>
							<tr>
								<th>Domain</th>
								<th>Community</th>
								<th>Subdomain</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{filteredCommunities.map((c) => (
								<tr key={c.id}>
									<td>
										<a
											href={`https://${c.domain}`}
											target="_blank"
											rel="noopener noreferrer"
											className="community-link"
										>
											{c.domain}
										</a>
									</td>
									<td>{c.title}</td>
									<td>
										<code>{c.subdomain}</code>
									</td>
									<td>
										<Button
											small
											minimal
											intent={Intent.DANGER}
											icon="trash"
											onClick={() => setPendingRemove(c)}
											disabled={isLoading}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}

			<Dialog
				isOpen={!!pendingRemove}
				onClose={() => setPendingRemove(null)}
				title="Remove Custom Domain"
				icon="warning-sign"
			>
				<div className={Classes.DIALOG_BODY}>
					<p>
						Remove custom domain <strong>{pendingRemove?.domain}</strong> from{' '}
						<strong>{pendingRemove?.title}</strong>?
					</p>
					<p>This will also remove it from Cloudflare.</p>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setPendingRemove(null)}>Cancel</Button>
						<Button
							intent={Intent.DANGER}
							onClick={() => pendingRemove && handleRemove(pendingRemove)}
							loading={isLoading}
						>
							Remove
						</Button>
					</div>
				</div>
			</Dialog>
		</div>
	);
};

export default CustomDomains;
