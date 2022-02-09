import React from 'react';
import { Button, Tooltip } from '@blueprintjs/core';

import { DefinitelyHas, Pub, SubmissionStatus, DocJson } from 'types';
import { ConfirmDialog, DialogLauncher } from 'client/components';
import { apiFetch } from 'client/utils/apiFetch';
import VerdictDialog from './VerdictDialog';

require('./arbitrationMenu.scss');

type Props = {
	pub: DefinitelyHas<Pub, 'submission'>;
	onDeletePub: () => unknown;
	onJudgePub: (status: SubmissionStatus) => unknown;
};

const ArbitrationMenu = (props: Props) => (
	<div className="arbitration-menu-component">
		{[
			{ presentTense: 'Decline', pastTense: 'declined', iconName: 'thumbs-down' as const },
			{ presentTense: 'Accept', pastTense: 'accepted', iconName: 'endorsed' as const },
		].map(
			({ presentTense, pastTense, iconName }) =>
				props.pub.submission.status !== pastTense && (
					<DialogLauncher
						key={pastTense}
						renderLauncherElement={({ openDialog }) => (
							<Tooltip content={presentTense}>
								<Button minimal icon={iconName} onClick={openDialog} />
							</Tooltip>
						)}
					>
						{({ isOpen, onClose }) => (
							<VerdictDialog
								isOpen={isOpen}
								onClose={onClose}
								shouldOfferEmail={true}
								actionTitle={presentTense}
								completedName={pastTense}
								status={pastTense as SubmissionStatus}
								initialEmailText={
									props.pub.submission.submissionWorkflow?.[`${pastTense}Text`]
								}
								onSubmit={(customEmailText?: DocJson, shouldSendEmail?: boolean) =>
									apiFetch.put('/api/submissions', {
										id: props.pub.submission.id,
										status: pastTense,
										skipEmail: !shouldSendEmail,
										customEmailText:
											customEmailText ||
											props.pub.submission.submissionWorkflow?.[
												`${pastTense}Text`
											],
									})
								}
								onJudgePub={props.onJudgePub}
							/>
						)}
					</DialogLauncher>
				),
		)}
		<ConfirmDialog
			confirmLabel="Delete Pub"
			title="Delete this Pub?"
			text="If you delete this Pub, it will be gone forever. Neither you nor its submitters will be able to access it."
			onConfirm={() =>
				apiFetch
					.delete('/api/pubs', { pubId: props.pub.id })
					.then(() => props.onDeletePub())
			}
		>
			{({ open }) => (
				<Tooltip content="Delete Pub">
					<Button minimal icon="trash" onClick={open} />
				</Tooltip>
			)}
		</ConfirmDialog>
	</div>
);

export default ArbitrationMenu;
