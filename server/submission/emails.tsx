import React from 'react';
import ReactDOMServer from 'react-dom/server';

import * as types from 'types';
import { SubmissionEmail, Editor } from 'components';
import { Collection, Community, SubmissionWorkflow, User } from 'server/models';
import { sendEmail } from 'server/utils/email';
import { pubUrl } from 'utils/canonicalUrls';
import { expect } from 'utils/assert';

type SendEmailOptions = {
	previousStatus: types.SubmissionStatus;
	submission: types.Submission & { pub: types.DefinitelyHas<types.Pub, 'members'> };
	customText?: types.DocJson;
};

const getEmailKindToSend = (
	previousStatus: types.SubmissionStatus,
	currentStatus: types.SubmissionStatus,
): null | types.SubmissionEmailKind => {
	if (previousStatus === 'incomplete' && currentStatus === 'received') {
		return 'received';
	}
	if (previousStatus === 'received' && currentStatus === 'accepted') {
		return 'accepted';
	}
	if (previousStatus === 'received' && currentStatus === 'declined') {
		return 'declined';
	}
	return null;
};

const getSubmittersInfo = async (members: types.Member[]) => {
	const pubMembers = members.filter((m) => !!m.pubId);
	const [earliestAddedMember] = pubMembers.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
	const users: { id: string; fullName: string; email: string }[] = await User.findAll({
		where: { id: pubMembers.map((m) => m.userId) },
		attributes: ['id', 'fullName', 'email'],
		order: [['createdAt', 'ASC']],
	});
	const earliestAddedUser = users.find((u) => u.id === earliestAddedMember.userId);
	return {
		submitterName: earliestAddedUser?.fullName ?? 'Submitter',
		submitterEmails: users.map((u) => u.email),
	};
};

const deriveEmailCustomText = (
	emailKind: types.SubmissionEmailKind,
	submissionWorkflow: types.SubmissionWorkflow | SubmissionWorkflow,
	customText: types.Maybe<types.DocJson>,
) => {
	if (customText) {
		return customText;
	}
	if (emailKind === 'received') {
		return submissionWorkflow.receivedEmailText;
	}
	return null;
};

export const sendSubmissionEmail = async (options: SendEmailOptions) => {
	const { previousStatus, submission, customText: providedCustomText } = options;
	const emailKind = getEmailKindToSend(previousStatus, submission.status);
	if (emailKind) {
		const { submitterName, submitterEmails } = await getSubmittersInfo(submission.pub.members);
		const modelPromises = await Promise.all([
			Community.findOne({ where: { id: submission.pub.communityId } }),
			SubmissionWorkflow.findOne({
				where: { id: submission.submissionWorkflowId },
				include: [{ model: Collection, as: 'collection' }],
			}),
		]);

		const community = expect(modelPromises[0]);
		const submissionWorkflow = expect(modelPromises[1]) as types.DefinitelyHas<
			SubmissionWorkflow,
			'collection'
		>;

		const customText = deriveEmailCustomText(emailKind, submissionWorkflow, providedCustomText);
		const html = ReactDOMServer.renderToString(
			<SubmissionEmail
				kind={emailKind}
				customText={customText && <Editor initialContent={customText} isReadOnly />}
				submissionTitle={submission.pub.title}
				collectionTitle={expect(submissionWorkflow.collection.title)}
				submitterName={submitterName}
				submissionUrl={pubUrl(community, submission.pub)}
				community={community}
			/>,
		);
		await sendEmail({
			from: { address: 'submissions@mg.pubpub.org', name: `PubPub Submissions` },
			to: submitterEmails,
			cc: submissionWorkflow.targetEmailAddresses,
			subject: `Your submission to ${community.title}`,
			html,
			replyTo: submissionWorkflow.targetEmailAddresses[0],
		});
	}
};
