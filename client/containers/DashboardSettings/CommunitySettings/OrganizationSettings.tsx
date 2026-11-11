import type { Community } from 'types';

import React, { useCallback, useEffect, useState } from 'react';

import { Button, Callout, HTMLSelect, InputGroup, Spinner } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { SettingsSection } from 'components';

type Props = {
	communityData: Community;
};

type OrgSummary = { id: string; slug: string; title: string; avatar: string | null };

type PendingInvite = {
	id: string;
	org?: OrgSummary;
	requestedBy?: { fullName: string };
};

type OrganizationData = {
	org: OrgSummary | null;
	canLeave: boolean;
	invites: PendingInvite[];
	requests: PendingInvite[];
	adminOrgs: OrgSummary[];
};

const OrgLink = ({ org }: { org: OrgSummary }) => (
	<a href={`/org/${org.slug}`} target="_blank" rel="noopener noreferrer">
		{org.title}
	</a>
);

const whatJoiningMeans = (orgTitle: string) =>
	`${orgTitle} would own this community. Its members get their org level here (view, edit, manage or admin) on top of anyone you add yourself, and its dashboard and analytics include this community. Admins of ${orgTitle} can release it again.`;

const OrganizationSettings = (props: Props) => {
	const { communityData } = props;
	const base = `/api/communities/${communityData.id}/organization`;
	const [data, setData] = useState<OrganizationData | null>(null);
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const [targetOrgId, setTargetOrgId] = useState('');
	const [requestSlug, setRequestSlug] = useState('');

	const load = useCallback(async () => {
		const result = (await apiFetch.get(base)) as OrganizationData;
		setData(result);
		const choices = result.adminOrgs.filter((o) => o.id !== result.org?.id);
		setTargetOrgId(choices[0]?.id ?? '');
	}, [base]);

	useEffect(() => {
		load().catch((e) => setError(e?.message || 'Failed to load the organization'));
	}, [load]);

	const run = async (action: () => Promise<unknown>) => {
		setBusy(true);
		setError('');
		try {
			await action();
			await load();
		} catch (e: any) {
			setError(e?.message || 'Something went wrong');
		} finally {
			setBusy(false);
		}
	};

	if (!data) {
		return (
			<SettingsSection title="Organization">
				{error ? <Callout intent="danger">{error}</Callout> : <Spinner size={20} />}
			</SettingsSection>
		);
	}

	const { org, canLeave, invites, requests, adminOrgs } = data;
	const otherAdminOrgs = adminOrgs.filter((o) => o.id !== org?.id);
	const targetOrg = otherAdminOrgs.find((o) => o.id === targetOrgId);

	return (
		<SettingsSection title="Organization">
			{error && (
				<Callout intent="danger" style={{ marginBottom: 12 }}>
					{error}
				</Callout>
			)}

			{org ? (
				<p>
					This community belongs to <OrgLink org={org} />. Members of {org.title} get
					their org level here, and its dashboard and analytics include this community.
				</p>
			) : (
				<p>This community doesn&rsquo;t belong to an organization.</p>
			)}

			{org && canLeave && (
				<p>
					<Button
						intent="danger"
						outlined
						text={`Leave ${org.title}`}
						disabled={busy}
						onClick={() => {
							// biome-ignore lint/suspicious/noAlert: confirming a destructive action
							if (window.confirm(`Release this community from ${org.title}?`)) {
								run(() => apiFetch.delete(base));
							}
						}}
					/>
				</p>
			)}

			{invites.map((invite) => (
				<Callout key={invite.id} intent="primary" style={{ marginBottom: 12 }}>
					<p>
						<strong>{invite.org && <OrgLink org={invite.org} />}</strong> invites this
						community to join
						{invite.requestedBy ? ` (sent by ${invite.requestedBy.fullName})` : ''}.
					</p>
					<p>{whatJoiningMeans(invite.org?.title ?? 'The org')}</p>
					<Button
						intent="primary"
						text="Accept"
						disabled={busy || !!org}
						onClick={() =>
							run(() => apiFetch.post(`/api/orgInvites/${invite.id}/accept`, {}))
						}
					/>{' '}
					<Button
						text="Decline"
						disabled={busy}
						onClick={() =>
							run(() => apiFetch.post(`/api/orgInvites/${invite.id}/decline`, {}))
						}
					/>
				</Callout>
			))}

			{requests.map((request) => (
				<Callout key={request.id} style={{ marginBottom: 12 }}>
					<p>
						This community asked to join{' '}
						{request.org ? <OrgLink org={request.org} /> : 'an org'}. An admin of the
						org needs to accept.
					</p>
					<Button
						text="Cancel request"
						disabled={busy}
						onClick={() =>
							run(() => apiFetch.post(`/api/orgInvites/${request.id}/cancel`, {}))
						}
					/>
				</Callout>
			))}

			{otherAdminOrgs.length > 0 && (!org || canLeave) && (
				<div style={{ marginBottom: 12 }}>
					<p>
						{org
							? 'You are an admin of other orgs too, so you can move this community to one of them.'
							: 'You are an org admin, so you can add this community to your org directly.'}
					</p>
					<HTMLSelect
						value={targetOrgId}
						onChange={(e) => setTargetOrgId(e.target.value)}
						options={otherAdminOrgs.map((o) => ({ value: o.id, label: o.title }))}
					/>{' '}
					<Button
						intent="primary"
						text={org ? 'Move' : 'Join'}
						disabled={busy || !targetOrg}
						onClick={() => {
							if (
								targetOrg &&
								// biome-ignore lint/suspicious/noAlert: confirming the move
								window.confirm(whatJoiningMeans(targetOrg.title))
							) {
								run(() => apiFetch.post(base, { orgId: targetOrg.id }));
							}
						}}
					/>
				</div>
			)}

			{!org && requests.length === 0 && (
				<div>
					<p>To ask an org to take this community, enter the org&rsquo;s slug.</p>
					<InputGroup
						leftIcon="office"
						value={requestSlug}
						onChange={(e) => setRequestSlug(e.target.value.trim())}
						placeholder="The org's slug, as in pubpub.org/org/your-slug"
						rightElement={
							<Button
								minimal
								text="Ask to join"
								disabled={busy || !requestSlug}
								onClick={() =>
									run(async () => {
										await apiFetch.post(base, { orgSlug: requestSlug });
										setRequestSlug('');
									})
								}
							/>
						}
					/>
				</div>
			)}
		</SettingsSection>
	);
};

export default OrganizationSettings;
