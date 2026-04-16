import React, { useCallback, useEffect, useState } from 'react';

import { Button, Callout, Classes, Spinner, Tag } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { InputField } from 'components';

type DeletionAudit = {
	communityId: string;
	communityTitle: string;
	communitySubdomain: string;
	totalPubs: number;
	pubsWithDoi: number;
	pubsWithReleases: number;
	pubsWithoutDoi: number;
};

type Props = {
	communityData: {
		id: string;
		title: string;
	};
};

const DeleteCommunity = (props: Props) => {
	const { communityData } = props;
	const [audit, setAudit] = useState<DeletionAudit | null>(null);
	const [isLoadingAudit, setIsLoadingAudit] = useState(false);
	const [confirmationTitle, setConfirmationTitle] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadAudit = useCallback(async () => {
		setIsLoadingAudit(true);
		try {
			const result = await apiFetch.get(`/api/communities/${communityData.id}/deletionAudit`);
			setAudit(result);
		} catch (err: any) {
			setError(err?.message || 'Failed to load deletion audit');
		} finally {
			setIsLoadingAudit(false);
		}
	}, [communityData.id]);

	useEffect(() => {
		loadAudit();
	}, [loadAudit]);

	const normalizedConfirmation = confirmationTitle.toLowerCase().trim().replace(/\s+/g, ' ');
	const normalizedTitle = communityData.title.toLowerCase().trim().replace(/\s+/g, ' ');
	const canDelete = normalizedConfirmation === normalizedTitle;

	const handleDelete = async () => {
		setIsDeleting(true);
		setError(null);
		try {
			await apiFetch('/api/communities/' + communityData.id, {
				method: 'DELETE',
				body: JSON.stringify({ confirmationTitle: communityData.title }),
			});
			window.location.href = 'https://www.pubpub.org';
		} catch (err: any) {
			setError(err?.message || 'Failed to delete community');
			setIsDeleting(false);
		}
	};

	return (
		<div>
			<h5>Delete community</h5>
			<Callout intent="danger" icon="warning-sign">
				<p>
					<b>Deleting a community is permanent and cannot be undone.</b>
				</p>
				{isLoadingAudit && <Spinner size={20} />}
				{audit && (
					<div style={{ marginBottom: 15 }}>
						<p>
							This community contains <b>{audit.totalPubs}</b> pub
							{audit.totalPubs !== 1 ? 's' : ''}:
						</p>
						<ul style={{ margin: '8px 0' }}>
							{audit.pubsWithDoi > 0 && (
								<li>
									<Tag intent="warning" minimal>
										{audit.pubsWithDoi}
									</Tag>{' '}
									pub{audit.pubsWithDoi !== 1 ? 's' : ''} with DOIs will be{' '}
									<b>moved to archive.pubpub.org</b> to preserve the scholarly
									record. Their discussions, releases, drafts, and attributions
									will be preserved.
								</li>
							)}
							{audit.pubsWithoutDoi > 0 && (
								<li>
									<Tag intent="danger" minimal>
										{audit.pubsWithoutDoi}
									</Tag>{' '}
									pub{audit.pubsWithoutDoi !== 1 ? 's' : ''} without DOIs will be{' '}
									<b>permanently deleted</b> along with all their discussions,
									releases, and metadata.
								</li>
							)}
						</ul>
						<p>
							All pages, collections, members, and community settings will be
							permanently deleted.
						</p>
					</div>
				)}
				<p>
					Please type <b>{communityData.title}</b> below to confirm.
				</p>
				<InputField
					label={<b>Confirm community title</b>}
					value={confirmationTitle}
					onChange={(evt) => setConfirmationTitle(evt.target.value)}
				/>
				{error && (
					<Callout intent="danger" style={{ marginBottom: 10 }}>
						{error}
					</Callout>
				)}
				<Button
					intent="danger"
					text="Delete community"
					loading={isDeleting}
					onClick={handleDelete}
					disabled={!canDelete}
				/>
			</Callout>
		</div>
	);
};

export default DeleteCommunity;
