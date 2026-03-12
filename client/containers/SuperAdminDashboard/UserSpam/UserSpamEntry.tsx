import type { SpamStatus, UserSpamTagFields } from 'types';

import type { SpamAction } from './MarkSpamStatusButton';

import React, { useCallback, useMemo, useState } from 'react';

import { Button, type Intent, Spinner, Tag } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { formatDate } from 'utils/dates';

import './userSpamEntry.scss';

import type { RecentDiscussion, SpamUser } from './types';

import { Popover } from 'client/components';

import UserSpamActions from './UserSpamActions';

type Props = {
	user: SpamUser;
	onStatusChanged?: (userId: string, status: SpamStatus | null) => void;
};

const getIntentForSpamScore = (spamScore: number): Intent => {
	if (spamScore > 3) return 'danger';
	if (spamScore > 1) return 'warning';
	return 'none';
};

const DiscussionItem = ({ discussion }: { discussion: RecentDiscussion }) => {
	const url =
		discussion.communitySubdomain && discussion.pubSlug
			? `https://${discussion.communitySubdomain}.pubpub.org/pub/${discussion.pubSlug}`
			: null;

	return (
		<div className="discussion-item">
			<div className="discussion-header">
				{url ? (
					<a href={url} target="_blank" rel="noopener noreferrer">
						{discussion.pubTitle || 'Untitled pub'}
					</a>
				) : (
					<span>{discussion.pubTitle || 'Untitled pub'}</span>
				)}
				{discussion.communitySubdomain && (
					<Tag minimal>{discussion.communitySubdomain}</Tag>
				)}
				<span className="discussion-date">{formatDate(discussion.createdAt)}</span>
			</div>
			{discussion.firstCommentText && (
				<div className="discussion-preview">
					{discussion.firstCommentText.length > 200
						? `${discussion.firstCommentText.slice(0, 200)}...`
						: discussion.firstCommentText}
				</div>
			)}
		</div>
	);
};

const UserSpamEntry = (props: Props) => {
	const { user, onStatusChanged: onStatusChangedProp } = props;
	const { fullName, email, slug, createdAt, spamTag, affiliation, communityBans } = user;
	const hasTag = spamTag != null;
	const initialStatus = hasTag ? spamTag.status : null;
	const [status, setUpdatedStatus] = useState<null | SpamStatus>(initialStatus);

	const handleStatusChanged = useCallback(
		(action: SpamAction) => {
			setUpdatedStatus(action === 'remove' ? null : action);
			onStatusChangedProp?.(user.id, action === 'remove' ? null : action);
		},
		[user.id, onStatusChangedProp],
	);

	const [recentDiscussions, setRecentDiscussions] = useState<RecentDiscussion[] | null>(null);
	const [discussionsLoading, setDiscussionsLoading] = useState(false);

	const fields = hasTag
		? ((spamTag.fields ?? {}) as UserSpamTagFields)
		: ({} as UserSpamTagFields);
	const fieldsJsonString = useMemo(() => JSON.stringify(fields, null, 2), [fields]);

	const _handleToggleDiscussions = useCallback(async () => {
		if (recentDiscussions) return;
		setDiscussionsLoading(true);
		try {
			const result = await apiFetch.post('/api/spamTags/userRecentDiscussions', {
				userId: user.id,
			});
			setRecentDiscussions(result);
		} finally {
			setDiscussionsLoading(false);
		}
	}, [user.id, recentDiscussions]);

	const renderFieldsBan = () => {
		if (Object.keys(fields).length === 0) return null;
		return (
			<div className="fields-ban">
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

	const [_removeLoading, _setRemoveLoading] = useState(false);

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

	const renderHoneypotTriggers = () => {
		const triggers = fields?.honeypotTriggers;
		if (!triggers?.length) return null;
		return (
			<div className="honeypot-triggers">
				<h3>Honeypot triggers</h3>
				<ul>
					{triggers.map((trigger, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: stable list
						<li key={index}>
							<Tag intent="danger" minimal>
								{trigger.honeypot}
							</Tag>{' '}
							<code>{trigger.value}</code>
						</li>
					))}
				</ul>
			</div>
		);
	};

	const popoverContent = useMemo(() => {
		if (discussionsLoading) {
			return (
				<div className="discussions-popover-content">
					<Spinner size={16} />
				</div>
			);
		}
		if (!recentDiscussions || recentDiscussions.length === 0) {
			return (
				<div className="discussions-popover-content">
					<div className="no-discussions">No discussions found</div>
				</div>
			);
		}
		return (
			<div className="discussions-popover-content">
				{recentDiscussions.map((d) => (
					<DiscussionItem key={d.id} discussion={d} />
				))}
			</div>
		);
	}, [recentDiscussions, discussionsLoading]);

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
		if (discussionCount > 0) {
			parts.push(
				<Popover
					key="discussions"
					placement="bottom-start"
					aria-label="Recent discussions"
					content={popoverContent}
					unstable_fixed
					lazy={false}
				>
					<Button
						minimal
						onClick={_handleToggleDiscussions}
						small
						className="inline-discussions-btn"
					>
						{discussionCount} discussion(s)
					</Button>
				</Popover>,
			);
		}
		return (
			<div className="affiliation">
				{parts.map((part, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: idcc
					<span key={index} className="affiliation-part">
						{part}
						{index < parts.length - 1 ? ' \u00b7 ' : ''}
					</span>
				))}
			</div>
		);
	};

	const renderCommunityBans = () => {
		if (!communityBans?.length) return null;
		return (
			<div className="community-bans">
				{communityBans.map((ban, index) => {
					return (
						<Popover
							aria-label="Flag details"
							key={`${ban.id}-${index}`}
							placement="bottom"
							content={
								<div className="flag-detail-popover">
									<div className="flag-detail-header">
										<Tag intent="warning" minimal>
											{ban.reason}
										</Tag>
										<span className="flag-detail-meta">
											{ban.actorName && (
												<>
													banned by{' '}
													<a
														href={`/user/${ban.actorSlug}`}
														target="_blank"
														rel="noopener noreferrer"
													>
														{ban.actorName}
													</a>
												</>
											)}{' '}
											{formatDate(ban.createdAt)}
										</span>
									</div>
									{ban.reasonText && (
										<div className="flag-detail-note">{ban.reasonText}</div>
									)}
									{ban.sourceCommentText && (
										<div className="flag-detail-comment">
											<span className="flag-detail-comment-label">
												Banned comment
											</span>
											<blockquote>
												{ban.sourceCommentText.length > 300
													? `${ban.sourceCommentText.slice(0, 300)}...`
													: ban.sourceCommentText}
											</blockquote>
											<p className="flag-detail-comment-context">
												On{' '}
												<a
													href={`https://${ban.communitySubdomain}.pubpub.org/pub/${ban.sourceCommentPubSlug}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													{ban.sourceCommentPubTitle}
												</a>{' '}
												in{' '}
												<a
													href={`https://${ban.communitySubdomain}.pubpub.org`}
													target="_blank"
													rel="noopener noreferrer"
												>
													{ban.communityTitle}
												</a>
											</p>
										</div>
									)}
								</div>
							}
						>
							<Button minimal small icon="flag" intent="warning">
								{ban.communitySubdomain}: {ban.reason}
							</Button>
						</Popover>
					);
				})}
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
			{renderFieldsBan()}
			{renderSuspiciousFiles()}
			{renderSuspiciousComments()}
			{renderHoneypotTriggers()}
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
				<div className="actions">
					<UserSpamActions
						userId={user.id}
						status={status}
						handleAction={handleStatusChanged}
					/>
				</div>
			</div>
			{renderCommunityBans()}
		</div>
	);
};

export default UserSpamEntry;
