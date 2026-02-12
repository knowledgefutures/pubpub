import type { SpamStatus } from 'types';

import React, { useCallback, useMemo, useState } from 'react';

import { Button, ButtonGroup, type Intent, Tag } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { formatDate } from 'utils/dates';

import MarkSpamStatusButton from './MarkSpamStatusButton';

import './userSpamEntry.scss';

import type { SpamUser } from './types';

type Props = {
	user: SpamUser;
	onSpamTagRemoved?: (userId: string) => void;
};

const getIntentForSpamScore = (spamScore: number): Intent => {
	if (spamScore > 3) return 'danger';
	if (spamScore > 1) return 'warning';
	return 'none';
};

const UserSpamEntry = (props: Props) => {
	const { user, onSpamTagRemoved } = props;
	const { fullName, email, slug, createdAt, spamTag, affiliation } = user;
	const hasTag = spamTag != null;
	const initialStatus = hasTag ? spamTag.status : null;
	const [status, setUpdatedStatus] = useState<null | SpamStatus>(initialStatus);

	const fields = hasTag ? (spamTag.fields ?? {}) : {};
	const fieldsJsonString = useMemo(() => JSON.stringify(fields, null, 2), [fields]);

	const renderFieldsReport = () => {
		if (Object.keys(fields).length === 0) return null;
		return (
			<div className="fields-report">
				<details>
					<summary>Matched fields</summary>
					<code>
						<pre>{fieldsJsonString}</pre>
					</code>
				</details>
			</div>
		);
	};

	const renderStatusTag = () => {
		if (!hasTag || status === null) {
			return <Tag minimal>No spam information</Tag>;
		}
		if (status === 'unreviewed') {
			return <Tag minimal>Unreviewed</Tag>;
		}
		if (status === 'confirmed-spam') {
			return (
				<Tag intent="danger" icon="cross">
					Confirmed spam
				</Tag>
			);
		}
		return (
			<Tag intent="success" icon="tick">
				Confirmed not spam
			</Tag>
		);
	};

	const [removeLoading, setRemoveLoading] = useState(false);
	const handleRemoveTag = useCallback(async () => {
		setRemoveLoading(true);
		try {
			await apiFetch.delete('/api/spamTags/user', { userId: user.id });
			setUpdatedStatus(null);
			onSpamTagRemoved?.(user.id);
		} finally {
			setRemoveLoading(false);
		}
	}, [user.id, onSpamTagRemoved]);

	const renderActions = () => {
		if (!hasTag || status === null) {
			return (
				<ButtonGroup>
					<MarkSpamStatusButton
						userId={user.id}
						status="unreviewed"
						onStatusChanged={setUpdatedStatus}
					/>
					<MarkSpamStatusButton
						userId={user.id}
						status="confirmed-not-spam"
						onStatusChanged={setUpdatedStatus}
					/>
					<MarkSpamStatusButton
						userId={user.id}
						status="confirmed-spam"
						onStatusChanged={setUpdatedStatus}
					/>
				</ButtonGroup>
			);
		}
		if (status === 'unreviewed') {
			return (
				<ButtonGroup>
					<MarkSpamStatusButton
						userId={user.id}
						status="confirmed-not-spam"
						onStatusChanged={setUpdatedStatus}
					/>
					<MarkSpamStatusButton
						userId={user.id}
						status="confirmed-spam"
						onStatusChanged={setUpdatedStatus}
					/>
					<Button minimal icon="remove" loading={removeLoading} onClick={handleRemoveTag}>
						Remove spam tag
					</Button>
				</ButtonGroup>
			);
		}
		if (status === 'confirmed-spam') {
			return (
				<ButtonGroup>
					<MarkSpamStatusButton
						userId={user.id}
						status="confirmed-not-spam"
						onStatusChanged={setUpdatedStatus}
						label="Mark as not spam"
					/>
					<MarkSpamStatusButton
						userId={user.id}
						status="unreviewed"
						onStatusChanged={setUpdatedStatus}
					/>
					<Button minimal icon="remove" loading={removeLoading} onClick={handleRemoveTag}>
						Remove spam tag
					</Button>
				</ButtonGroup>
			);
		}
		return (
			<ButtonGroup>
				<MarkSpamStatusButton
					userId={user.id}
					status="confirmed-spam"
					onStatusChanged={setUpdatedStatus}
					label="Mark as spam"
				/>
				<MarkSpamStatusButton
					userId={user.id}
					status="unreviewed"
					onStatusChanged={setUpdatedStatus}
				/>
				<Button minimal icon="remove" onClick={handleRemoveTag}>
					Remove spam tag
				</Button>
			</ButtonGroup>
		);
	};

	const renderSuspiciousFiles = () => {
		const list = fields?.suspiciousFiles;
		if (!list?.length) return null;
		return (
			<div className="suspicious-files">
				<h3>Suspicious files</h3>
				<ul>
					{list.map((file) => (
						<li key={file}>
							<a href={file} target="_blank" rel="noopener noreferrer">
								{file}
							</a>
						</li>
					))}
				</ul>
			</div>
		);
	};

	const renderSuspiciousComments = () => {
		const list = fields?.suspiciousComments;
		if (!list?.length) return null;
		return (
			<div className="suspicious-comments">
				<h3>Suspicious comments</h3>
				<ul>
					{list.map((comment) => (
						<li key={comment}>{comment}</li>
					))}
				</ul>
			</div>
		);
	};

	const renderAffiliation = () => {
		if (!affiliation) return null;
		const { communitySubdomains, pubCount, discussionCount } = affiliation;
		if (communitySubdomains.length === 0 && pubCount === 0 && discussionCount === 0) {
			return null;
		}
		const parts: React.ReactNode[] = [];
		if (communitySubdomains.length > 0) {
			parts.push(
				<span>
					Communities:{' '}
					{communitySubdomains.slice(0, 5).map((subdomain, index) => (
						<a
							key={subdomain}
							href={`https://${subdomain}.pubpub.org`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{subdomain}
							{index < communitySubdomains.length - 1 ? ', ' : ''}
						</a>
					))}
					{communitySubdomains.length > 5 ? '...' : ''}
				</span>,
			);
		}
		if (pubCount > 0) parts.push(`${pubCount} pub(s)`);
		if (discussionCount > 0) parts.push(`${discussionCount} discussion(s)`);
		return (
			<div className="affiliation">
				<Tag minimal>
					{parts.map((part, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: idcc
						<span key={index}>
							{part}
							{index < parts.length - 1 ? ' · ' : ''}
						</span>
					))}
				</Tag>
			</div>
		);
	};

	return (
		<div className="user-spam-entry-component">
			<div className="title">
				<a className="name" href={`/user/${slug}`}>
					{fullName}
				</a>
				{email && <span className="email">{email}</span>}
				{slug && <span className="slug">@{slug}</span>}
			</div>
			{renderFieldsReport()}
			{renderSuspiciousFiles()}
			{renderSuspiciousComments()}
			<div className="details">
				<div className="tags">
					{renderStatusTag()}
					{hasTag && spamTag && (
						<Tag intent={getIntentForSpamScore(spamTag.spamScore)}>
							Spam score: {spamTag.spamScore}
						</Tag>
					)}
					<Tag minimal>Created: {formatDate(createdAt)}</Tag>
					{renderAffiliation()}
				</div>
				<div className="actions">{renderActions()}</div>
			</div>
		</div>
	);
};

export default UserSpamEntry;
