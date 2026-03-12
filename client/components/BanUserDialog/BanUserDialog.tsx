import type { CommunityBan } from 'server/models';
import type { BanReason, SerializedModel } from 'types';

import React, { useCallback, useState } from 'react';

import { Button, Callout, Classes, Dialog, HTMLSelect, Intent, TextArea } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { moderationReasonLabels } from 'utils/moderationReasons';

const reasons = (Object.entries(moderationReasonLabels) as [BanReason, string][]).map(
	([value, label]) => ({ value, label }),
);

type Props = {
	isOpen: boolean;
	onClose: () => void;
	userId: string;
	communityId: string;
	threadCommentId?: string | null;
	userName?: string;
	onBanned?: (banData: SerializedModel<CommunityBan>) => void;
};

const BanUserDialog = (props: Props) => {
	const { isOpen, onClose, userId, communityId, threadCommentId, userName, onBanned } = props;
	const [reason, setReason] = useState<BanReason>('spam-content');
	const [reasonText, setReasonText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const banData = await apiFetch.post('/api/communityBans', {
				userId,
				communityId,
				reason,
				reasonText: reasonText.trim() || null,
				sourceThreadCommentId: threadCommentId ?? null,
			});
			onBanned?.(banData);
			onClose();
		} catch (err: any) {
			setError(err?.message ?? 'Failed to ban user');
		} finally {
			setIsLoading(false);
		}
	}, [userId, communityId, reason, reasonText, threadCommentId, onBanned, onClose]);

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={`Ban user${userName ? `: ${userName}` : ''}`}
			style={{ width: 520 }}
		>
			<div className={Classes.DIALOG_BODY}>
				<Callout intent={Intent.WARNING} style={{ marginBottom: 20 }}>
					<p style={{ margin: '0 0 8px' }}>
						<strong>This will ban the user from your community.</strong> They will not
						be able to perform any actions, including creating Pubs, posting
						discussions, or editing content.
					</p>
					<p style={{ margin: '0 0 8px' }}>
						All of their existing discussions and comments will be hidden from other
						users. You can reverse this action at any time from the Members settings.
					</p>
					<p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
						The user will <strong>not</strong> be notified of this action.
					</p>
				</Callout>

				<div style={{ marginBottom: 14 }}>
					<label htmlFor="flag-reason" style={{ fontWeight: 600, fontSize: 14 }}>
						Reason
					</label>
					<HTMLSelect
						id="flag-reason"
						value={reason}
						onChange={(e) => setReason(e.target.value as BanReason)}
						fill
						style={{ marginTop: 4 }}
					>
						{reasons.map((r) => (
							<option key={r.value} value={r.value}>
								{r.label}
							</option>
						))}
					</HTMLSelect>
				</div>

				<div style={{ marginBottom: 8 }}>
					<label htmlFor="flag-reason-text" style={{ fontWeight: 600, fontSize: 14 }}>
						Details (optional)
					</label>
					<p style={{ margin: '2px 0 6px', fontSize: 13, color: '#666' }}>
						This message will be sent to the PubPub team and helps us identify patterns
						of abuse across the platform.
					</p>
					<TextArea
						id="flag-reason-text"
						value={reasonText}
						onChange={(e) => setReasonText(e.target.value)}
						fill
						rows={3}
						placeholder="Provide additional context about why this user is being banned..."
						style={{ marginTop: 0 }}
					/>
				</div>

				{error && (
					<div style={{ color: 'var(--pt-intent-danger)', marginTop: 8, fontSize: 13 }}>
						{error}
					</div>
				)}
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button text="Cancel" onClick={onClose} disabled={isLoading} />
					<Button
						text="Ban user"
						intent={Intent.DANGER}
						onClick={handleSubmit}
						loading={isLoading}
					/>
				</div>
			</div>
		</Dialog>
	);
};

export default BanUserDialog;
