import type { SpamTag } from 'types';

import React, { useCallback, useState } from 'react';

import { Button, Classes, Dialog, TextArea } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { Icon } from 'components';

import './spamBanner.scss';

type Props = {
	spamTag: SpamTag;
	communityId: string;
	canAdminCommunity: boolean;
};

const SpamBanner = (props: Props) => {
	const { spamTag: initialSpamTag, communityId, canAdminCommunity } = props;
	const [spamTag, setSpamTag] = useState(initialSpamTag);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [message, setMessage] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleRequestReview = useCallback(async () => {
		setIsSubmitting(true);
		setError(null);
		try {
			const result = await apiFetch.post('/api/spamTags/requestCommunityReview', {
				communityId,
				message: message.trim() || undefined,
			});
			setSpamTag(result.spamTag);
			setIsSubmitted(true);
		} catch (err: any) {
			setError(err?.message ?? 'Something went wrong. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	}, [communityId, message]);

	const handleCloseDialog = useCallback(() => {
		if (!isSubmitting) {
			setIsDialogOpen(false);
		}
	}, [isSubmitting]);

	if (spamTag.status === 'unreviewed' && !spamTag.approvalRequestedAt) {
		return (
			<div className="spam-banner-component">
				<Icon icon="info-sign" iconSize={16} />
				<div className="text">
					Your community is not yet publicly visible. When you're ready, request approval
					to make it available to all. All features and functionality are available in the
					meantime, but only logged-in Members can view the community.
				</div>
				<Button
					className="review-button"
					intent="primary"
					disabled={!canAdminCommunity}
					title={
						canAdminCommunity ? undefined : 'Only community admins can request approval'
					}
					onClick={() => setIsDialogOpen(true)}
				>
					Request Approval
				</Button>
				<Dialog
					isOpen={isDialogOpen}
					onClose={handleCloseDialog}
					title="Request Approval"
					className="review-request-dialog"
				>
					<div className={Classes.DIALOG_BODY}>
						{isSubmitted ? (
							<div className="submitted-confirmation">
								<Icon icon="tick-circle" iconSize={24} />
								<p>
									Your request has been submitted! Our team will review your
									community and, once approved, it will become publicly visible to
									all visitors.
								</p>
							</div>
						) : (
							<>
								<p>
									New communities must be approved before they are publicly
									visible. Requesting approval will notify our team to review your
									community.
								</p>
								<p>
									To help us approve your community quickly, you can include a
									brief description of its purpose and the content you plan to
									publish.
								</p>
								<TextArea
									fill
									placeholder="What is this community about? (optional)"
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									disabled={isSubmitting}
									maxLength={2000}
									rows={4}
								/>
								{error && <div className="error-message">{error}</div>}
							</>
						)}
					</div>
					<div className={Classes.DIALOG_FOOTER}>
						<div className={Classes.DIALOG_FOOTER_ACTIONS}>
							{isSubmitted ? (
								<Button onClick={handleCloseDialog}>Close</Button>
							) : (
								<>
									<Button disabled={isSubmitting} onClick={handleCloseDialog}>
										Cancel
									</Button>
									<Button
										intent="primary"
										loading={isSubmitting}
										onClick={handleRequestReview}
									>
										Request Approval
									</Button>
								</>
							)}
						</div>
					</div>
				</Dialog>
			</div>
		);
	}

	if (spamTag.status === 'unreviewed' && spamTag.approvalRequestedAt) {
		return (
			<div className="spam-banner-component review-submitted">
				<Icon icon="tick-circle" iconSize={16} />
				<div className="text">
					Your approval request has been submitted. Once approved, your community will
					become publicly visible to all visitors. During this time, all features and
					functionality remain available, but only logged in Members will be able to view
					the community.
				</div>
			</div>
		);
	}

	return (
		<div className="spam-banner-component">
			<Icon icon="error" iconSize={16} />
			<div className="text">
				We have determined that your Community violates PubPub's{' '}
				<a href="/legal/terms">Terms of Service</a>, and it is now hidden from visitors. If
				you believe this judgement was made in error, please{' '}
				<a href="mailto:help@pubpub.org">contact us</a>.
			</div>
		</div>
	);
};

export default SpamBanner;
