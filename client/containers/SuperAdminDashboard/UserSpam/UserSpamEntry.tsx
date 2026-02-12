import type { SpamStatus } from 'types';

import React, { useMemo, useState } from 'react';

import { ButtonGroup, type Intent, Tag } from '@blueprintjs/core';

import { formatDate } from 'utils/dates';

import MarkSpamStatusButton from './MarkSpamStatusButton';

import './userSpamEntry.scss';

import type { SpamUser } from './types';

type Props = {
	user: SpamUser;
};

const getIntentForSpamScore = (spamScore: number): Intent => {
	if (spamScore > 3) {
		return 'danger';
	}
	if (spamScore > 1) {
		return 'warning';
	}
	return 'none';
};

const UserSpamEntry = (props: Props) => {
	const { user } = props;
	const { fullName, email, slug, createdAt, spamTag } = user;
	const { spamScore, status: initialStatus, fields } = spamTag;
	const [status, setUpdatedStatus] = useState<null | SpamStatus>(initialStatus);

	const fieldsJsonString = useMemo(() => JSON.stringify(fields, null, 2), [fields]);

	const renderFieldsReport = () => {
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

	const renderActions = () => {
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
				</ButtonGroup>
			);
		}
		return (
			<MarkSpamStatusButton
				userId={user.id}
				status="unreviewed"
				onStatusChanged={setUpdatedStatus}
			/>
		);
	};

	const renderSuspiciousFiles = () => {
		return (
			<div className="suspicious-files">
				<h3>Suspicious files</h3>
				<ul>
					{fields.suspiciousFiles.map((file) => (
						<li key={file}>
							<a
								href={`https://pubpub.org/uploads/${file}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								{file}
							</a>
						</li>
					))}
				</ul>
			</div>
		);
	};

	const renderSuspiciousComments = () => {
		return (
			<div className="suspicious-comments">
				<h3>Suspicious comments</h3>
				<ul>
					{fields.suspiciousComments.map((comment) => (
						<li key={comment}>{comment}</li>
					))}
				</ul>
			</div>
		);
	};

	return (
		<div className="user-spam-entry-component">
			<div className="title">
				<span className="name">{fullName}</span>
				{email && <span className="email">{email}</span>}
				{slug && <span className="slug">@{slug}</span>}
			</div>
			{Object.keys(fields).length > 0 && renderFieldsReport()}
			{fields?.suspiciousFiles?.length > 0 && renderSuspiciousFiles()}
			{fields?.suspiciousComments?.length > 0 && renderSuspiciousComments()}
			<div className="details">
				<div className="tags">
					{renderStatusTag()}
					<Tag intent={getIntentForSpamScore(spamScore)}>Spam score: {spamScore}</Tag>
					<Tag minimal>Created: {formatDate(createdAt)}</Tag>
				</div>
				<div className="actions">{renderActions()}</div>
			</div>
		</div>
	);
};

export default UserSpamEntry;
