import React from 'react';
import { Button } from '@blueprintjs/core';

import { DefinitelyHas, Pub, SubmissionStatus, DocJson } from 'types';
import { ConfirmDialog, Icon, IconName, DialogLauncher } from 'client/components';
import { apiFetch } from 'client/utils/apiFetch';
import VerdictDialog from './VerdictDialog';

require('./arbitrationMenu.scss');

type Props = {
	pub: DefinitelyHas<Pub, 'submission'>;
	onJudgePub: (pubId: string, status: SubmissionStatus) => void;
};

const ArbitrationMenu = (props: Props) => (
	<div className="arbitration-menu-component">
		<div style={{ gridColumn: 1 }}>
			<ConfirmDialog
				confirmLabel="Delete"
				text="Are you sure you want to delete this submission?"
				onConfirm={() =>
					apiFetch
						.delete('/api/pubs', {
							pubId: props.pub.id,
						})
						.then(() => props.onJudgePub(props.pub.id, props.pub.submission.status))
				}
			>
				{({ open }) => (
					<Button
						minimal
						small
						icon={<Icon icon="cross" iconSize={20} />}
						onClick={open}
					/>
				)}
			</ConfirmDialog>
		</div>
		{[
			{ presentTense: 'Decline', pastTense: 'declined', iconName: 'thumbs-down' },
			{ presentTense: 'Accept', pastTense: 'accepted', iconName: 'endorsed' },
		].map(
			({ presentTense, pastTense, iconName }, index) =>
				props.pub.submission.status !== pastTense && (
					<div style={{ gridColumn: index + 2 }} key={pastTense}>
						<DialogLauncher
							renderLauncherElement={({ openDialog }) => (
								<Button
									minimal
									small
									icon={<Icon icon={iconName as IconName} iconSize={20} />}
									onClick={openDialog}
								/>
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
										props.pub.submission.submissionWorkflow?.[
											`${pastTense}Text`
										]
									}
									onSubmit={(
										customEmailText?: DocJson,
										shouldSendEmail?: boolean,
									) =>
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
									pub={props.pub}
									onJudgePub={props.onJudgePub}
								/>
							)}
						</DialogLauncher>
					</div>
				),
		)}
	</div>
);

export default ArbitrationMenu;
