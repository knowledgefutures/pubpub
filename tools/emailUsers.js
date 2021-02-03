/* eslint-disable no-console */
import Promise from 'bluebird';
import { User } from 'server/models';
import { Op } from 'sequelize';
import mailgun from 'mailgun.js';
import stripIndent from 'strip-indent';
import { isProd } from 'utils/environment';
import { promptOkay } from './utils/prompt';

const mg = mailgun.client({
	username: 'api',
	key: process.env.MAILGUN_API_KEY,
});

const alreadySent = [
	'ckyriako@stevens.edu',
	'qfazeem@yahoo.com',
	'qyang1@cs.cmu.edu',
	'qfazeem@yahoo.com',
	'jethanis@unimelb.edu.au',
	'mike@h.im',
	'qyang1@cs.cmu.edu',
	'qfazeem@yahoo.com',
	'aadressen@gmail.com',
	'pilgrimhawk@gmail.com',
	'mail@csaladen.es',
	'vickybippart@gmail.com',
	'io_oi@tlen.pl',
	'csikos@mckinsey.com',
	'biniwalejaydip@gmail.com',
	'physci@gmail.com',
	'ack@fastmail.fm',
	'endemically@gmail.com',
	'paulpangaro@pangaro.com',
	'ralicelik@hotmail.com',
	'ver.uribe@gmail.com',
	'pika.dotty@gmail.com',
	'mauro.dalessandro@gmail.com',
	'hello@chriswan.me',
	'parthoguha13@gmail.com',
	'petr@petrnovikov.com',
	'sataylor@mit.edu',
	'ckyriako@stevens.edu',
	'thariq@media.mit.edu',
	'jaenen@hotmail.com',
	'cs.foong@nxp.com',
	'filip.vasic@52hours.co',
	'rd@rudidedoncker.be',
	'fabianbarros@gmail.com',
	'gersch.kim@gmail.com',
	'martha.sedgwick@sagepub.com',
	'marcelo230786@gmail.com',
	'rdukeweb@gmail.com',
	'e_des@gmx.com',
	'nicole.radziwill@gmail.com',
	'me@jeroencarelse.com',
	'er.badere@gmail.com',
	'inglis@cshl.edu',
	'claphang@gmail.com',
	'garabot@gmail.com',
	'dmatho@gmail.com',
	'majid@designcoders.org',
	'elenadepomar@gmail.com',
	'aformalacademy@gmail.com',
	'vignesh17kaka@gmail.com',
	'vasan.churchill@swerea.se',
	'susamartinez@gmail.com',
	'roshinth.sreekumar@imaginea.com',
	'avila.christopher@gmail.com',
	'swapnil.vibhute1@gmail.com',
	'flytoe@gmail.com',
	'cloud@labcd.mx',
	'eric.meltzer@gmail.com',
	'maxwshen@gmail.com',
	'vineetpadia@gmail.com',
	'chamandu@gmail.com',
	'westfood@gmail.com',
	'boris@anthony.net',
	'ivica.covic@polimi.it',
	'harsh.s.bhat@gmail.com',
	'mtseng@gmail.com',
	'foerster.desiree@gmail.com',
	'petr.palan@merck.com',
	'arathael@gmail.com',
	'grada@bu.edu',
	'jethanis@unimelb.edu.au',
	'victtorglez@gmail.com',
	'kirsten_rulf@hks17.harvard.edu',
	'jnani@mit.edu',
	'kenn@ibinary.com',
	'pabloescudero@outlook.com',
	'concept108@mail.ru',
	'luispedrovieira@gmail.com',
	'nsfininis@gmail.com',
	'giusic_90@hotmail.it',
	'f.armezzani@gmail.com',
	'malatmals@gmail.com',
	'asif.amirguliyev@gmail.com',
	'james.mungai.njugi@gmail.com',
	'bptimko@gmail.com',
	'cripley@ryerson.ca',
	'raul.decastro@gmail.com',
	'rmiller@ironsidegroup.com',
	'mike@h.im',
	'arathael@gmail.com',
	'dmatho@gmail.com',
	'kirsten_rulf@hks17.harvard.edu',
	'physci@gmail.com',
	'qyang1@cs.cmu.edu',
	'vickybippart@gmail.com',
	'tscholl@berklee.edu',
	'maxwshen@gmail.com',
	'bptimko@gmail.com',
	'endemically@gmail.com',
	'roshinth.sreekumar@imaginea.com',
	'fabianbarros@gmail.com',
	'cs.foong@nxp.com',
	'pdavila@faculty.ocadu.ca',
	'aadressen@gmail.com',
	'ralicelik@hotmail.com',
	'rdukeweb@gmail.com',
	'gersch.kim@gmail.com',
	'garabot@gmail.com',
	'rmiller@ironsidegroup.com',
	'marcelo230786@gmail.com',
	'malatmals@gmail.com',
	'asif.amirguliyev@gmail.com',
	'raul.decastro@gmail.com',
	'swapnil.vibhute1@gmail.com',
	'vignesh17kaka@gmail.com',
	'hello@chriswan.me',
	'vasan.churchill@swerea.se',
	'nicole.radziwill@gmail.com',
	'james.mungai.njugi@gmail.com',
	'biniwalejaydip@gmail.com',
	'eric.meltzer@gmail.com',
	'claphang@gmail.com',
	'jaenen@hotmail.com',
	'avila.christopher@gmail.com',
	'ack@fastmail.fm',
	'susamartinez@gmail.com',
	'jwegener@rebu.city',
	'me@jeroencarelse.com',
	'boris@anthony.net',
	'elenadepomar@gmail.com',
	'grada@bu.edu',
	'qfazeem@yahoo.com',
	'io_oi@tlen.pl',
	'csikos@mckinsey.com',
	'giusic_90@hotmail.it',
	'concept108@mail.ru',
	'mail@csaladen.es',
	'aurelien@tabard.fr',
	'filip.vasic@52hours.co',
	'f.armezzani@gmail.com',
	'martha.sedgwick@sagepub.com',
	'mauro.dalessandro@gmail.com',
	'jethanis@unimelb.edu.au',
	'nsfininis@gmail.com',
	'pabloescudero@outlook.com',
	'luispedrovieira@gmail.com',
	'vineetpadia@gmail.com',
	'rd@rudidedoncker.be',
	'pilgrimhawk@gmail.com',
	'paulpangaro@pangaro.com',
	'parthoguha13@gmail.com',
	'inglis@cshl.edu',
	'pdavila@faculty.ocadu.ca',
	'cripley@ryerson.ca',
	'foerster.desiree@gmail.com',
	'ivica.covic@polimi.it',
	'ckyriako@stevens.edu',
	'flytoe@gmail.com',
	'chamandu@gmail.com',
	'westfood@gmail.com',
	'kenn@ibinary.com',
	'jwegener@rebu.city',
	'mtseng@gmail.com',
	'majid@designcoders.org',
	'petr.palan@merck.com',
	'ver.uribe@gmail.com',
	'petr@petrnovikov.com',
	'pika.dotty@gmail.com',
	'aformalacademy@gmail.com',
	'thariq@media.mit.edu',
	'er.badere@gmail.com',
	'harsh.s.bhat@gmail.com',
	'cloud@labcd.mx',
	'victtorglez@gmail.com',
	'e_des@gmx.com',
	'sataylor@mit.edu',
	'jnani@mit.edu',
];

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
	const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
				where: { email: { [Op.notIn]: alreadySent } },
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
