import stripIndent from 'strip-indent';

import { sendEmail } from './transport';

export const sendAccountExportReadyEmail = ({
	toEmail,
	downloadUrl,
}: {
	toEmail: string;
	downloadUrl: string;
}) => {
	return sendEmail({
		to: [toEmail],
		subject: 'Your PubPub Data Export is Ready',
		text: stripIndent(`
			Your PubPub account data export is ready to download.

			${downloadUrl}

			This link will expire in 7 days. Please download your data before then.

			Sincerely,
			PubPub Support
		`),
		replyTo: 'hello@pubpub.org',
	});
};

export const sendCommunityExportReadyEmail = ({
	toEmail,
	communityTitle,
	downloadUrl,
}: {
	toEmail: string;
	communityTitle: string;
	downloadUrl: string;
}) => {
	return sendEmail({
		to: [toEmail],
		subject: `Your PubPub Community Export is Ready · ${communityTitle}`,
		text: stripIndent(`
			The data export for your community "${communityTitle}" is ready to download.

			${downloadUrl}

			This link will expire in 7 days. Please download your data before then.

			Sincerely,
			PubPub Support
		`),
		replyTo: 'hello@pubpub.org',
	});
};
