/* eslint-disable no-console */
import Promise from 'bluebird';
import { User } from 'server/models';
// import { Op } from 'sequelize';
import mailgun from 'mailgun.js';
import stripIndent from 'strip-indent';
import { isProd } from 'utils/environment';
import { promptOkay } from './utils/prompt';

const mg = mailgun.client({
	username: 'api',
	key: process.env.MAILGUN_API_KEY,
});

const emailSubject = 'Proposed Terms and Privacy Policy Updates';
const emailBody = stripIndent(`
Hello,

We're building PubPub for readers, publishing communities, and knowledge creators. 
Not for analytics companies. We've been working hard with a legal team that specializes
in open-source software on updating PubPub's Privacy Policy, Terms of Service, and
Acceptable Use Policy to be easier to understand, more comprehensive, and more
protective of user and community rights on PubPub, while also trying to minimize
PubPub's rights as much as possible.

You can read the proposed new policies at the following URLs:

https://www.pubpub.org/legal/proposed-terms
https://www.pubpub.org/legal/proposed-privacy
https://www.pubpub.org/legal/proposed-aup

These policies will replace our existing ones and go into effect two weeks from now, on
Monday, February 8, 2021. In the meantime, we sincerely welcome your feedback and
comments on our proposed policies.

Please visit the following discussion thread on our new PubPub Forum to add your thoughts: 

https://github.com/pubpub/pubpub/discussions/1248

Sincerely,
Your PubPub Team

Note: this email was sent to you because you have a PubPub user account, and we are
required to send you updates to our Terms of Service (it's also the right thing to do).
We will never share your email address with any third parties, period. And we won't
send you promotional email without your explicit consent. If you would like to stop
receiving emails from us entirely, you must request that your PubPub account be deleted.
You can do so here: https://www.pubpub.org/legal/settings
`);

function validateEmail(email) {
	const re =
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}

const sendEmail = async (user) => {
	const userEmail = user.dataValues.email;
	if (!validateEmail(userEmail)) {
		return Promise.resolve(`SKIPPING: ${userEmail} (invalid email)`);
	}
	try {
		// Uncomment the below to see attempted emails.
		// console.log(`ATTEMPTING: ${userEmail}`);
		await mg.messages.create('mg.pubpub.org', {
			from: 'PubPub Team <hello@pubpub.org>',
			to: [userEmail],
			subject: emailSubject,
			text: emailBody,
		});
		const successMessage = `SUCCEEDED: ${userEmail}`;
		/* This is the only guaranteed log of emails sent. Promise.map does not guarantee order,
		so this list is vital to preserve in case the wrapped promise fails or times out. 
		Note that success = successfully sent, not delivered. */
		console.log(successMessage);
		return Promise.resolve(successMessage);
	} catch (err) {
		return Promise.resolve(`FAILED: ${userEmail} (${err.message})`);
	}
};

const main = async () => {
	const query = isProd()
		? {
				attributes: ['email'],
				order: [['createdAt', 'ASC']],
				// limit: 500,
				// offset: 0,
				// where: { email: { [Op.notIn]: alreadySent } },
		  }
		: { where: { email: 'team@pubpub.org' } };
	const users = await User.findAll(query);
	// Uncomment the below to see the list of users you'll send to
	/* users.forEach((user) => {
		console.log(user.email);
	}); */
	console.log(`${emailBody}`);
	await promptOkay(`Send the above email to ${users.length} users?`, {
		yesIsDefault: false,
		throwIfNo: true,
	});
	try {
		const emailed = await Promise.map(users, sendEmail, { concurrency: 5 });
		emailed.forEach((emailedMessage) => {
			console.log(emailedMessage);
		});
	} catch (err) {
		console.warn(err);
	}
};

main().finally(() => process.exit(0));
