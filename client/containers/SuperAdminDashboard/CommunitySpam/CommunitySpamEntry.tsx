import React, { useMemo, useState } from 'react';
import { Tag, Intent, ButtonGroup } from '@blueprintjs/core';

import { Community, DefinitelyHas, SpamStatus } from 'types';
import { communityUrl } from 'utils/canonicalUrls';
import { formatDate } from 'utils/dates';

import MarkSpamStatusButton from './MarkSpamStatusButton';

require('./communitySpamEntry.scss');

type Props = {
	community: DefinitelyHas<Community, 'spamTag'>;
};

const getIntentForSpamScore = (spamScore: number): Intent => {
	if (spamScore > 3) {
		return 'danger';
	}
	if (spamScore > 1) {
		return 'warning';
	}
	return 'primary';
};

const CommunitySpamEntry = (props: Props) => {
	const { community } = props;
	const { title, description, createdAt, spamTag } = community;
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
						communityId={community.id}
						status="confirmed-not-spam"
						onStatusChanged={setUpdatedStatus}
					/>
					<MarkSpamStatusButton
						communityId={community.id}
						status="confirmed-spam"
						onStatusChanged={setUpdatedStatus}
					/>
				</ButtonGroup>
			);
		}
		return (
			<MarkSpamStatusButton
				communityId={community.id}
				status="unreviewed"
				onStatusChanged={setUpdatedStatus}
			/>
		);
	};

	return (
		<div className="community-spam-entry-component">
			<div className="title">
				<a href={communityUrl(community)} target="_blank" rel="noopener noreferrer">
					{title}
				</a>
			</div>
			{description && <div className="description">{description}</div>}
			{Object.keys(fields).length > 0 && renderFieldsReport()}
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

export default CommunitySpamEntry;
