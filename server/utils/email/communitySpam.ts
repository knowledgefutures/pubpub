import stripIndent from 'strip-indent';

import { Member, User } from 'server/models';

import { sendEmail } from './reset';

// can maybe add this back in later to get emails, for now this might just create too much noise
// const CC_DEV = ['dev@pubpub.org'];

type CommunityEmailContext = {
	communityId: string;
	communityTitle: string;
	communityUrl: string;
};

const getAdminEmailsForCommunity = async (communityId: string) => {
	const members = await Member.findAll({
		where: { communityId, permissions: 'admin' },
		include: [{ model: User, as: 'user', attributes: ['email', 'fullName'] }],
	});
	return members
		.filter((m) => m.user?.email)
		.map((m) => ({ email: m.user!.email, name: m.user!.fullName }));
};

export const sendCommunityAwaitingApprovalEmail = async (ctx: CommunityEmailContext) => {
	const admins = await getAdminEmailsForCommunity(ctx.communityId);
	if (!admins.length) {
		return;
	}
	return sendEmail({
		to: admins.map((a) => a.email),
		subject: `Community created: ${ctx.communityTitle} is awaiting approval`,
		text: stripIndent(`
			Hello,

			Your community "${ctx.communityTitle}" has been created on PubPub.

			New communities are currently subject to approval for compliance with our Terms of Service and Acceptable Use Policy. We strive to moderate all new communities within five business days. During this time, all features and functionality are available, but only logged in Members will be able to view the community.

			You can access your community at: ${ctx.communityUrl}

			Sincerely,
			PubPub Team
		`),
	});
};

export const sendCommunityApprovedEmail = async (ctx: CommunityEmailContext) => {
	const admins = await getAdminEmailsForCommunity(ctx.communityId);
	if (!admins.length) {
		return;
	}
	return sendEmail({
		to: admins.map((a) => a.email),
		subject: `Community approved: ${ctx.communityTitle}`,
		text: stripIndent(`
			Hello,

			Your community "${ctx.communityTitle}" has been approved and is now publicly visible to all visitors.

			You can access your community at: ${ctx.communityUrl}

			Sincerely,
			PubPub Team
		`),
	});
};

export const sendCommunityRejectedAsSpamEmail = async (ctx: CommunityEmailContext) => {
	const admins = await getAdminEmailsForCommunity(ctx.communityId);
	if (!admins.length) {
		return;
	}
	return sendEmail({
		to: admins.map((a) => a.email),
		subject: `Community restricted: ${ctx.communityTitle}`,
		text: stripIndent(`
			Hello,

			Your community "${ctx.communityTitle}" has been flagged as in violation of PubPub's Terms of Service and is now hidden from visitors.

			If you have requested your community to be removed by us, don't worry, we just use this mechanism to do so.

			If you believe this is an error, please contact us at hello@pubpub.org.

			Sincerely,
			PubPub Team
		`),
	});
};
