import stripIndent from 'strip-indent';

import { sendEmail } from './transport';

export const sendServicesInquiryEmail = ({ contactEmail, additionalDetails, selections }) => {
	return sendEmail({
		to: ['partnerships@pubpub.org'],
		subject: 'Community Services Form Submission',
		text: stripIndent(`
			A Community Services inquiry was submitted:
			
			Contact Email: ${contactEmail},
			
			-----
			${selections}
			-----
			
			Additional Details: ${additionalDetails}
		
			Sincerely,
			PubPub Bot
		`),
		replyTo: 'hello@pubpub.org',
	});
};
